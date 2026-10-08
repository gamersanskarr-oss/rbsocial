"use client";

import { useActionState } from "react";
import { addClient, type ActionState } from "@/app/actions/admin";

const initial: ActionState = {};

export default function AddClientForm({ designers }: { designers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addClient, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Client name</label>
          <input name="name" required className="input" placeholder="Acme Cafe" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Contact (optional)</label>
          <input name="contact" className="input" placeholder="email or phone" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Assign to designer</label>
          <select name="assignedToId" className="input" defaultValue="">
            <option value="">Unassigned</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add Client"}
      </button>
    </form>
  );
}
