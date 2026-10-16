"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp, FieldValue, parseClientRequirements } from "@/lib/data";
import { adminAuth } from "@/lib/firebase-admin";
import { requireAdmin, requireAdminOrManager } from "@/lib/auth";

export type ActionState = { error?: string; success?: string };

export async function addEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const team = String(formData.get("team") ?? "");
  const role = String(formData.get("role") ?? "EMPLOYEE");
  const isManager = role === "MANAGER";
  const noTeam = isManager || role === "ACCOUNTANT";
  if (
    !name ||
    !email ||
    !password ||
    !["EMPLOYEE", "MANAGER", "ACCOUNTANT"].includes(role) ||
    (role === "EMPLOYEE" && !["DESIGN", "IT"].includes(team))
  ) {
    return { error: "All fields are required (team must be Design or IT)." };
  }

  let uid: string;
  try {
    const record = await adminAuth.createUser({ email, password, displayName: name });
    uid = record.uid;
  } catch {
    return { error: "Could not create login (email may already exist)." };
  }

  await adminDb.collection("users").doc(uid).set({
    name,
    email,
    role,
    team: noTeam ? null : team,
    missedDeadlines: 0,
    perPostPay: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/employees");
  const label = role === "MANAGER" ? "Manager" : role === "ACCOUNTANT" ? "Accountant" : "Employee";
  return { success: `${label} ${name} added.` };
}

export async function addClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const assignedToIds = formData.getAll("assignedToIds").map(String).filter(Boolean);
  const assignedToId = assignedToIds[0] ?? null; // legacy mirror of the first assignee
  if (!name) return { error: "Client name is required." };
  try {
    await adminDb.collection("clients").add({
      name,
      contact,
      phone: null,
      instagram: null,
      facebook: null,
      website: null,
      logoUrl: null,
      notes: null,
      requirements: parseClientRequirements(formData),
      assignedToId,
      assignedToIds,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { error: "Could not create client." };
  }
  revalidatePath("/admin/clients");
  return { success: `Client ${name} added.` };
}

export async function assignClient(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const assignedToIds = formData.getAll("assignedToIds").map(String).filter(Boolean);
  if (clientId) {
    await adminDb.collection("clients").doc(clientId).update({
      assignedToIds,
      assignedToId: assignedToIds[0] ?? null,
    });
  }
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/manager/clients");
  revalidatePath("/dashboard/clients");
}

export async function setPerPostPay(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const raw = String(formData.get("perPostPay") ?? "").trim();
  if (!userId) return;

  const amount = raw === "" ? null : Number(raw);
  if (amount !== null && (isNaN(amount) || amount < 0)) return;

  await adminDb.collection("users").doc(userId).update({ perPostPay: amount });
  revalidatePath("/admin/employees");
  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard");
}

export async function waiveMiss(formData: FormData) {
  await requireAdminOrManager(); // managers may excuse misses for their team
  const userId = String(formData.get("userId") ?? "");
  const mode = String(formData.get("mode") ?? "one");
  if (!userId) return;

  const doc = await adminDb.collection("users").doc(userId).get();
  if (!doc.exists) return;
  const current = Number(doc.data()?.missedDeadlines ?? 0);

  await adminDb
    .collection("users")
    .doc(userId)
    .update({ missedDeadlines: mode === "all" ? 0 : Math.max(0, current - 1) });

  revalidatePath("/admin/employees");
  revalidatePath("/admin/payouts");
  revalidatePath("/manager/team");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function createTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdminOrManager();
  const topic = String(formData.get("topic") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const deadline = String(formData.get("deadline") ?? "");
  const referenceLink = String(formData.get("referenceLink") ?? "").trim() || null;
  const taskType = String(formData.get("taskType") ?? "").trim();
  const payRaw = String(formData.get("payAmount") ?? "").trim();
  const payAmount =
    actor.role === "ADMIN" && payRaw !== "" ? Number(payRaw) : null; // managers can't set pay
  const slideRaw = String(formData.get("slideCount") ?? "").trim();
  const slideCount = slideRaw === "" ? null : Math.round(Number(slideRaw));

  if (!topic || !description || !clientId || !assignedToId || !deadline || !taskType) {
    return { error: "Topic, type, client, assignee, description and deadline are required." };
  }
  if (payAmount !== null && (isNaN(payAmount) || payAmount < 0)) {
    return { error: "Pay amount must be a valid number (leave blank to use the per-post rate)." };
  }
  if (slideCount !== null && (isNaN(slideCount) || slideCount < 1 || slideCount > 99)) {
    return { error: "Slide count must be between 1 and 99." };
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return { error: "Invalid deadline date." };

  try {
    await adminDb.collection("tasks").add({
      topic,
      description,
      type: taskType,
      slideCount: taskType === "Carousel" ? slideCount : null,
      payAmount,
      payStatus: payAmount !== null ? "APPROVED" : "NONE", // admin-set pay is pre-approved
      clientId,
      assignedToId,
      deadline: Timestamp.fromDate(deadlineDate),
      status: "PENDING",
      approval: "NONE",
      reviewNote: null,
      referenceLink,
      submissionLink: null,
      completedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { error: "Could not create task." };
  }
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/calendar");
  revalidatePath("/manager/tasks");
  revalidatePath("/manager/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: `Task "${topic}" assigned.` };
}

// ---------------------------------------------------------------------------
// Jobs / careers (admin-only)
// ---------------------------------------------------------------------------

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"];
const JOB_TEAMS = ["DESIGN", "IT", "MARKETING", "OPS"];

export async function addJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const team = String(formData.get("team") ?? "");
  const type = String(formData.get("type") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const salary = String(formData.get("salary") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const applyLink = String(formData.get("applyLink") ?? "").trim() || null;

  if (!title || !location || !description || !JOB_TYPES.includes(type) || !JOB_TEAMS.includes(team)) {
    return { error: "Title, team, type, location and description are required." };
  }

  try {
    await adminDb.collection("jobs").add({
      title,
      team,
      type,
      location,
      salary,
      description,
      applyLink,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { error: "Could not publish the job." };
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
  return { success: `"${title}" is live on the careers page.` };
}

export async function toggleJob(formData: FormData) {
  await requireAdmin();
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;
  const doc = await adminDb.collection("jobs").doc(jobId).get();
  if (!doc.exists) return;
  await doc.ref.update({ active: !doc.data()?.active });
  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
}

export async function deleteJob(formData: FormData) {
  await requireAdmin();
  const jobId = String(formData.get("jobId") ?? "");
  if (jobId) await adminDb.collection("jobs").doc(jobId).delete();
  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
}

/** Admin + manager: approve (optionally adjust) or decline an employee's pay quote. */
export async function reviewTaskPay(formData: FormData) {
  await requireAdminOrManager();
  const taskId = String(formData.get("taskId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (!taskId) return;

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists) return;
  const current = doc.data()!;

  if (mode === "approve") {
    const raw = String(formData.get("amount") ?? "").trim();
    const amount = raw === "" ? Number(current.payAmount ?? 0) : Number(raw);
    if (isNaN(amount) || amount < 0) return;
    await doc.ref.update({ payStatus: "APPROVED", payAmount: amount });
  } else if (mode === "decline") {
    await doc.ref.update({ payStatus: "NONE", payAmount: null });
  } else {
    return;
  }

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath(`/manager/tasks/${taskId}`);
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard");
}

/** Admin + manager: add a custom task category (shown in the assign-task dropdown). */
export async function addTaskType(name: string): Promise<ActionState> {
  await requireAdminOrManager();
  const label = name.trim().slice(0, 40);
  if (!label) return { error: "Type name is required." };

  await adminDb
    .collection("settings")
    .doc("taskTypes")
    .set({ options: FieldValue.arrayUnion(label) }, { merge: true });

  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  return { success: `"${label}" added to task types.` };
}
