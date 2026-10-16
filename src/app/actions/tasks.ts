"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp, FieldValue } from "@/lib/data";
import { requireAdminOrManager, requireUser } from "@/lib/auth";

export type SubmitState = { error?: string; success?: string };

export async function submitTask(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const submissionLink = String(formData.get("submissionLink") ?? "").trim();
  const payRaw = String(formData.get("payAmount") ?? "").trim();
  const payAmount = payRaw === "" ? null : Number(payRaw);

  if (!submissionLink) return { error: "Please paste the final link (e.g. Canva design link)." };
  if (payAmount !== null && (isNaN(payAmount) || payAmount < 0)) {
    return { error: "Amount must be a valid number." };
  }
  try {
    new URL(submissionLink);
  } catch {
    return { error: "That does not look like a valid URL." };
  }

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  const task = doc.exists ? doc.data()! : null;
  if (!task || task.assignedToId !== user.id) return { error: "Task not found." };
  if (task.status !== "PENDING" && task.status !== "MISSED") {
    return { error: "This task can no longer be submitted." };
  }

  const update: Record<string, unknown> = {
    status: "COMPLETED",
    submissionLink,
    completedAt: Timestamp.now(),
    lateSubmission: task.status === "MISSED",
    approval: "PENDING", // waits for admin/manager review
    reviewNote: null,
  };
  // Employee quoting a different amount → pending until admin/manager approves
  if (payAmount !== null && payAmount !== (task.payAmount ?? null)) {
    update.payAmount = payAmount;
    update.payStatus = "PENDING";
  }

  await doc.ref.update(update);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath(`/manager/tasks/${taskId}`);
  revalidatePath("/admin");
  return { success: "Task marked as completed." };
}

/** Employee explains why a task is late/missed — visible to admin & manager. */
export async function submitMissReason(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const reason = String(formData.get("missReason") ?? "").trim().slice(0, 500);
  if (!reason) return { error: "Please write a short reason." };

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists || doc.data()!.assignedToId !== user.id) return { error: "Task not found." };

  await doc.ref.update({ missReason: reason });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath(`/manager/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  revalidatePath("/dashboard");
  return { success: "Reason saved — your manager can see it." };
}

/** Admin/manager reviews a submission: approve, send back for changes, or reject. */
export async function reviewTask(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  await requireAdminOrManager();
  const taskId = String(formData.get("taskId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim().slice(0, 500);

  if (!["approve", "changes", "reject"].includes(decision)) {
    return { error: "Pick approve, request changes or reject." };
  }
  if (decision !== "approve" && !note) {
    return { error: "Add a short note so the employee knows what to fix." };
  }

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists) return { error: "Task not found." };
  const data = doc.data()!;
  if (data.status !== "COMPLETED") return { error: "Nothing to review — no submission yet." };

  if (decision === "approve") {
    await doc.ref.update({ approval: "APPROVED", reviewNote: note || null });
  } else {
    // Reopen the task so the employee can resubmit. If the deadline already
    // passed, give a fresh 24h window — an instant re-miss would be unfair.
    const raw = data.deadline;
    const dl: Date = typeof raw?.toDate === "function" ? raw.toDate() : new Date(raw);
    const update: Record<string, unknown> = {
      approval: decision === "changes" ? "CHANGES" : "REJECTED",
      reviewNote: note,
      status: "PENDING",
    };
    if (dl.getTime() < Date.now()) {
      update.deadline = Timestamp.fromDate(new Date(Date.now() + 24 * 36e5));
    }
    await doc.ref.update(update);
  }

  for (const p of [
    "/admin/tasks", "/manager/tasks", "/dashboard",
    `/admin/tasks/${taskId}`, `/manager/tasks/${taskId}`, `/dashboard/tasks/${taskId}`,
    "/admin/calendar", "/manager/calendar", "/dashboard/calendar", "/admin",
  ]) revalidatePath(p);

  return {
    success:
      decision === "approve"
        ? "Submission approved."
        : decision === "changes"
          ? "Sent back for changes — the employee can resubmit."
          : "Submission rejected — the employee can resubmit.",
  };
}

/** Full task edit — admin & manager. Pay field is admin-only. */
export async function updateTask(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const actor = await requireAdminOrManager();
  const taskId = String(formData.get("taskId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const deadline = String(formData.get("deadline") ?? "");
  const taskType = String(formData.get("taskType") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const referenceLink = String(formData.get("referenceLink") ?? "").trim() || null;
  const submissionLink = String(formData.get("submissionLink") ?? "").trim() || null;
  const slideRaw = String(formData.get("slideCount") ?? "").trim();
  const slideCount = slideRaw === "" ? null : Math.round(Number(slideRaw));
  const payRaw = String(formData.get("payAmount") ?? "").trim();
  const payAmount = payRaw === "" ? null : Number(payRaw);

  if (!topic || !description || !clientId || !assignedToId || !deadline || !taskType) {
    return { error: "Topic, type, client, assignee, description and deadline are required." };
  }
  if (!["PENDING", "COMPLETED", "MISSED"].includes(status)) {
    return { error: "Invalid status." };
  }
  if (slideCount !== null && (isNaN(slideCount) || slideCount < 1 || slideCount > 99)) {
    return { error: "Slide count must be between 1 and 99." };
  }
  if (actor.role === "ADMIN" && payAmount !== null && (isNaN(payAmount) || payAmount < 0)) {
    return { error: "Pay amount must be a valid number." };
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return { error: "Invalid deadline date." };

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists) return { error: "Task not found." };
  const data = doc.data()!;
  const oldStatus = String(data.status ?? "PENDING");

  const update: Record<string, unknown> = {
    topic,
    description,
    type: taskType,
    slideCount: taskType === "Carousel" ? slideCount : null,
    clientId,
    assignedToId,
    deadline: Timestamp.fromDate(deadlineDate),
    status,
    referenceLink,
    submissionLink,
  };
  if (status === "COMPLETED" && oldStatus !== "COMPLETED" && !data.completedAt) {
    update.completedAt = Timestamp.now();
  }
  // Only admins may touch the pay fields; managers' edits leave them untouched.
  if (actor.role === "ADMIN") {
    update.payAmount = payAmount;
    update.payStatus = payAmount !== null ? "APPROVED" : "NONE";
  }

  // A manual PENDING↔MISSED flip counts against / restores the strike.
  const strikeDelta =
    status === "MISSED" && oldStatus !== "MISSED" ? 1
    : oldStatus === "MISSED" && status !== "MISSED" ? -1
    : 0;

  if (strikeDelta !== 0 && assignedToId) {
    const userRef = adminDb.collection("users").doc(String(assignedToId));
    const u = await userRef.get();
    const cur = Number(u.data()?.missedDeadlines ?? 0);
    const batch = adminDb.batch();
    batch.update(doc.ref, update);
    batch.update(userRef, { missedDeadlines: Math.max(0, cur + strikeDelta) });
    await batch.commit();
  } else {
    await doc.ref.update(update);
  }

  for (const p of [
    "/admin/tasks", "/manager/tasks", "/dashboard",
    `/admin/tasks/${taskId}`, `/manager/tasks/${taskId}`, `/dashboard/tasks/${taskId}`,
    "/admin/calendar", "/manager/calendar", "/dashboard/calendar", "/admin",
  ]) revalidatePath(p);

  return { success: "Task updated." };
}

/** Drag-reschedule: keep the deadline's time-of-day, move it to `isoDay` ("YYYY-MM-DD"). */
export async function moveTaskDeadline(taskId: string, isoDay: string) {
  await requireAdminOrManager();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!taskId || !m) return;

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists) return;
  const data = doc.data()!;
  const raw = data.deadline;
  const old: Date = typeof raw?.toDate === "function" ? raw.toDate() : new Date(raw);
  const next = new Date(old);
  next.setFullYear(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // Status follows the new deadline: past = missed, future = back to pending.
  const status = String(data.status ?? "PENDING");
  const past = next.getTime() < Date.now();
  const assignee = String(data.assignedToId ?? "");
  const userRef = assignee ? adminDb.collection("users").doc(assignee) : null;

  if (status === "PENDING" && past) {
    const batch = adminDb.batch();
    batch.update(doc.ref, { deadline: Timestamp.fromDate(next), status: "MISSED" });
    if (userRef) batch.update(userRef, { missedDeadlines: FieldValue.increment(1) });
    await batch.commit();
  } else if (status === "MISSED" && !past) {
    if (userRef) {
      const u = await userRef.get();
      const cur = Number(u.data()?.missedDeadlines ?? 0);
      const batch = adminDb.batch();
      batch.update(doc.ref, { deadline: Timestamp.fromDate(next), status: "PENDING" });
      batch.update(userRef, { missedDeadlines: Math.max(0, cur - 1) });
      await batch.commit();
    } else {
      await doc.ref.update({ deadline: Timestamp.fromDate(next), status: "PENDING" });
    }
  } else {
    await doc.ref.update({ deadline: Timestamp.fromDate(next) });
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/manager/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  revalidatePath("/dashboard");
}
