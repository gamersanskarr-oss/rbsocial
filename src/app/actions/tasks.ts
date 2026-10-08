"use server";

import { revalidatePath } from "next/cache";
import { adminDb, Timestamp } from "@/lib/data";
import { requireUser } from "@/lib/auth";

export type SubmitState = { error?: string; success?: string };

export async function submitTask(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const submissionLink = String(formData.get("submissionLink") ?? "").trim();

  if (!submissionLink) return { error: "Please paste the final link (e.g. Canva design link)." };
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
    completedAt: Timestamp.now(),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return { success: "Task marked as completed." };
}
