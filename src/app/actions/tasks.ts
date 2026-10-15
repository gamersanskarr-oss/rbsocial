"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp } from "@/lib/data";
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
  if (task.status !== "PENDING") return { error: "This task can no longer be submitted." };

  await doc.ref.update({
    status: "COMPLETED",
    submissionLink,
    payAmount,
    completedAt: Timestamp.now(),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return { success: "Task marked as completed." };
}

/** Drag-reschedule: keep the deadline's time-of-day, move it to `isoDay` ("YYYY-MM-DD"). */
export async function moveTaskDeadline(taskId: string, isoDay: string) {
  await requireAdminOrManager();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!taskId || !m) return;

  const doc = await adminDb.collection("tasks").doc(taskId).get();
  if (!doc.exists) return;
  const raw = doc.data()!.deadline;
  const old: Date = typeof raw?.toDate === "function" ? raw.toDate() : new Date(raw);
  const next = new Date(old);
  next.setFullYear(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  await doc.ref.update({ deadline: Timestamp.fromDate(next) });

  revalidatePath("/admin/calendar");
  revalidatePath("/manager/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin/tasks");
  revalidatePath("/manager/tasks");
  revalidatePath("/dashboard");
}
