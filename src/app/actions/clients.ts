"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { adminDb, FieldValue, parseClientRequirements } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export type ClientState = { error?: string; success?: string };

const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function updateClientDetails(
  _prev: ClientState,
  formData: FormData
): Promise<ClientState> {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const facebook = String(formData.get("facebook") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const requirements = parseClientRequirements(formData);

  if (!name) return { error: "Client name is required." };

  let logoUrl: string | undefined;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = LOGO_TYPES[logoFile.type];
    if (!ext) return { error: "Logo must be a PNG, JPG, WebP or SVG file." };
    if (logoFile.size > 5 * 1024 * 1024) return { error: "Logo must be under 5 MB." };
    await mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
    const fileName = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(process.cwd(), "public", "uploads", fileName), Buffer.from(await logoFile.arrayBuffer()));
    logoUrl = `/uploads/${fileName}`;
  }

  try {
    await adminDb
      .collection("clients")
      .doc(clientId)
      .update({
        name,
        contact,
        phone,
        instagram,
        facebook,
        website,
        notes,
        requirements,
        ...(logoUrl ? { logoUrl } : {}),
      });
  } catch {
    return { error: "Could not update client." };
  }
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/dashboard/clients");
  return { success: "Client details saved." };
}

export async function addClientAsset(_prev: ClientState, formData: FormData): Promise<ClientState> {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name || !url) return { error: "Asset name and link are required." };
  try {
    new URL(url);
  } catch {
    return { error: "That does not look like a valid URL." };
  }
  await adminDb.collection("clientAssets").add({
    clientId,
    name,
    url,
    createdAt: FieldValue.serverTimestamp(),
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  return { success: `Asset "${name}" added.` };
}

export async function deleteClientAsset(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("assetId") ?? "");
  if (id) await adminDb.collection("clientAssets").doc(id).delete();
  revalidatePath("/admin/clients");
  revalidatePath("/dashboard/clients");
}
