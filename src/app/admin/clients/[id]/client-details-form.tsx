"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { updateClientDetails, type ClientState } from "@/app/actions/clients";
import RequirementsEditor, { type ClientRequirement } from "@/components/requirements-editor";

const initial: ClientState = {};

export type ClientDetails = {
  name: string;
  contact: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  notes: string | null;
  requirements: ClientRequirement[] | null;
};

export default function ClientDetailsForm({
  clientId,
  client,
  taskTypes,
}: {
  clientId: string;
  client: ClientDetails;
  taskTypes: string[];
}) {
  const [state, formAction, pending] = useActionState(updateClientDetails, initial);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="clientId" value={clientId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Client name</label>
          <input name="name" required defaultValue={client.name} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Phone number</label>
          <input name="phone" type="tel" defaultValue={client.phone ?? ""} className="input" placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Contact person / email</label>
          <input name="contact" defaultValue={client.contact ?? ""} className="input" placeholder="hello@client.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Website</label>
          <input name="website" type="url" defaultValue={client.website ?? ""} className="input" placeholder="https://client.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Instagram</label>
          <input name="instagram" defaultValue={client.instagram ?? ""} className="input" placeholder="https://instagram.com/…" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Facebook</label>
          <input name="facebook" type="url" defaultValue={client.facebook ?? ""} className="input" placeholder="https://facebook.com/…" />
        </div>
      </div>

      <RequirementsEditor types={taskTypes} initial={client.requirements} />

      <div>
        <label className="mb-1 block text-sm font-medium text-muted">
          Brand notes (colors, fonts, tone, do&apos;s and don&apos;ts…)
        </label>
        <textarea name="notes" rows={3} defaultValue={client.notes ?? ""} className="input" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted">Client logo (PNG, JPG, WebP or SVG — max 5 MB)</label>
        <input
          name="logoFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save Details"}
      </button>
    </form>
  );
}
