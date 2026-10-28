"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { addClientAsset, type ClientState } from "@/app/actions/clients";

const initial: ClientState = {};

export default function AssetForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(addClientAsset, initial);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="clientId" value={clientId} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="name"
          required
          className="input sm:w-52"
          placeholder="e.g. Primary logo pack"
        />
        <input
          name="url"
          type="url"
          required
          className="input sm:flex-1"
          placeholder="https://drive.google.com/… or https://canva.com/…"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          {pending ? "Adding…" : "Add Asset"}
        </button>
      </div>
    </form>
  );
}
