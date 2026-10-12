"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp } from "@/lib/data";
import { requireUser } from "@/lib/auth";

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
