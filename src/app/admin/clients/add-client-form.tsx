"use client";

import { useActionState } from "react";
import { addClient, type ActionState } from "@/app/actions/admin";
import RequirementsEditor from "@/components/requirements-editor";

const initial: ActionState = {};

export default function AddClientForm({
  designers,
  taskTypes,
}: {
  designers: { id: string; name: string }[];
  taskTypes: string[];
}) {
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
          <label className="mb-1 block text-sm text-muted">Assign to designer(s)</label>
          <div className="input flex min-h-[2.75rem] flex-wrap items-center gap-1.5 py-2">
            {designers.length === 0 && (
              <span className="text-sm text-faint">No designers yet</span>
            )}
            {designers.map((d) => (
              <label key={d.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="assignedToIds"
                  value={d.id}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-muted transition peer-checked:border-transparent peer-checked:bg-ink peer-checked:text-canvas">
                  {d.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <RequirementsEditor types={taskTypes} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add Client"}
      </button>
    </form>
  );
}
