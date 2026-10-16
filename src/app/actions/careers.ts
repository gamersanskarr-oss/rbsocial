"use server";

import { revalidatePath } from "next/cache";
import { adminDb, FieldValue } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export type ApplyState = { error?: string; success?: string };

const str = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "").trim().slice(0, max);

/** PUBLIC — anyone can apply from /careers. No auth required.
 *  `jobIds` is a repeated field — one application doc is written per role. */
export async function applyForJob(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const jobIds = formData.getAll("jobIds").map((v) => String(v).slice(0, 100)).filter(Boolean);
  const name = str(formData, "name", 100);
  const email = str(formData, "email", 150);
  const phone = str(formData, "phone", 25) || null;
  const portfolio = str(formData, "portfolio", 300) || null;
  const message = str(formData, "message", 2000) || null;

  if (jobIds.length === 0) {
    return { error: "Pick at least one role to apply for." };
  }
  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Resolve roles — only live jobs count
  const jobsSnap = await adminDb.collection("jobs").get();
  const picked = jobsSnap.docs
    .filter((d) => jobIds.includes(d.id) && d.data().active === true)
    .map((d) => ({ id: d.id, title: String(d.data().title ?? "Role") }));
  if (picked.length === 0) {
    return { error: "Those roles are no longer accepting applications." };
  }

  // Skip roles this email already applied to
  const existing = await adminDb
    .collection("jobApplications")
    .where("email", "==", email.toLowerCase())
    .get();
  const already = new Set(existing.docs.map((d) => String(d.data().jobId)));
  const fresh = picked.filter((j) => !already.has(j.id));

  if (fresh.length === 0) {
    return { error: `You've already applied for ${picked.length === 1 ? "that role" : "all of those roles"} — we'll be in touch!` };
  }

  try {
    const batch = adminDb.batch();
    for (const job of fresh) {
      batch.set(adminDb.collection("jobApplications").doc(), {
        jobId: job.id,
        jobTitle: job.title,
        name,
        email: email.toLowerCase(),
        phone,
        portfolio,
        message,
        status: "NEW",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  } catch {
    return { error: "Something went wrong — please try again." };
  }
  revalidatePath("/admin/jobs");
  const skipped = picked.length - fresh.length;
  const roleList = fresh.map((j) => j.title).join(", ");
  return {
    success:
      `Application sent for ${fresh.length === 1 ? roleList : `${fresh.length} roles`}! 🎉 We'll be in touch.` +
      (skipped > 0 ? ` (You'd already applied for ${skipped === 1 ? "one" : skipped}.)` : ""),
  };
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
