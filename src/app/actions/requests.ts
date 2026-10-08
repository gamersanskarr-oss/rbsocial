"use server";

import { revalidatePath } from "next/cache";
import { adminDb, FieldValue, Timestamp } from "@/lib/data";
import { requireUser, requireAdminOrManager } from "@/lib/auth";

export type RequestState = { error?: string; success?: string };

export async function addTaskRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!message) return { error: "Please write what you need from the admin." };

  const taskDoc = await adminDb.collection("tasks").doc(taskId).get();
  const task = taskDoc.exists ? taskDoc.data()! : null;
  if (!task || task.assignedToId !== user.id) return { error: "Task not found." };
  if (task.status !== "PENDING") {
    return { error: "This task is no longer active, so requests are closed." };
  }
  const hoursLeft = (task.deadline.toDate().getTime() - Date.now()) / 36e5;
  if (hoursLeft <= 6) {
    return { error: "Requests are closed — less than 6 hours are left until the deadline." };
  }

  await adminDb.collection("taskRequests").add({
    taskId,
    message,
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/manager/requests");
  revalidatePath("/admin");
  return { success: "Request sent to admin." };
}

export async function resolveRequest(formData: FormData) {
  await requireAdminOrManager();
  const id = String(formData.get("requestId") ?? "");
  if (id) {
    await adminDb.collection("taskRequests").doc(id).update({
      status: "RESOLVED",
      resolvedAt: Timestamp.now(),
    });
  }
  revalidatePath("/admin/requests");
  revalidatePath("/manager/requests");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteRequest(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("requestId") ?? "");
  if (!id) return;

  const doc = await adminDb.collection("taskRequests").doc(id).get();
  if (!doc.exists) return;
  const request = doc.data()!;
  const taskDoc = await adminDb.collection("tasks").doc(String(request.taskId)).get();
  if (taskDoc.exists && taskDoc.data()?.assignedToId === user.id) {
    await doc.ref.delete();
  }
  revalidatePath(`/dashboard/tasks/${request.taskId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}
