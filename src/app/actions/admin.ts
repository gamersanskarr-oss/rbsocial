"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp, FieldValue } from "@/lib/data";
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
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
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
      assignedToId,
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
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  if (clientId) {
    await adminDb.collection("clients").doc(clientId).update({ assignedToId });
  }
  revalidatePath("/admin/clients");
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
  await requireAdmin();
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
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function createTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminOrManager();
  const topic = String(formData.get("topic") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const deadline = String(formData.get("deadline") ?? "");
  const referenceLink = String(formData.get("referenceLink") ?? "").trim() || null;

  if (!topic || !description || !clientId || !assignedToId || !deadline) {
    return { error: "Topic, client, assignee, description and deadline are required." };
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return { error: "Invalid deadline date." };

  try {
    await adminDb.collection("tasks").add({
      topic,
      description,
      clientId,
      assignedToId,
      deadline: Timestamp.fromDate(deadlineDate),
      status: "PENDING",
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
