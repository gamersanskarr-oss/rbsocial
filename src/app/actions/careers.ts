"use server";

import { revalidatePath } from "next/cache";
import { adminDb, FieldValue } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export type ApplyState = { error?: string; success?: string };

const str = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "").trim().slice(0, max);

/** PUBLIC — anyone can apply from /careers. No auth required. */
export async function applyForJob(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const jobId = str(formData, "jobId", 100);
  const jobTitle = str(formData, "jobTitle", 150);
  const name = str(formData, "name", 100);
  const email = str(formData, "email", 150);
  const phone = str(formData, "phone", 25) || null;
  const portfolio = str(formData, "portfolio", 300) || null;
  const message = str(formData, "message", 2000) || null;

  if (!jobId || !name || !email) {
    return { error: "Name and email are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Verify the job exists and is still live
  const job = await adminDb.collection("jobs").doc(jobId).get();
  if (!job.exists || job.data()?.active !== true) {
    return { error: "This role is no longer accepting applications." };
  }

  // Block exact duplicates — same email already applied to this role
  const dup = await adminDb
    .collection("jobApplications")
    .where("jobId", "==", jobId)
    .where("email", "==", email.toLowerCase())
    .get();
  if (!dup.empty) {
    return { error: "You've already applied for this role — we'll be in touch!" };
  }

  try {
    await adminDb.collection("jobApplications").add({
      jobId,
      jobTitle,
      name,
      email: email.toLowerCase(),
      phone,
      portfolio,
      message,
      status: "NEW",
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    return { error: "Something went wrong — please try again." };
  }
  revalidatePath("/admin/jobs");
  return { success: "Application sent! 🎉 We'll review it and get back to you." };
}

export async function markApplicationReviewed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("applicationId") ?? "");
  if (!id) return;
  const doc = await adminDb.collection("jobApplications").doc(id).get();
  if (!doc.exists) return;
  await doc.ref.update({ status: doc.data()?.status === "NEW" ? "REVIEWED" : "NEW" });
  revalidatePath("/admin/jobs");
}

export async function deleteJobApplication(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("applicationId") ?? "");
  if (id) await adminDb.collection("jobApplications").doc(id).delete();
  revalidatePath("/admin/jobs");
}
