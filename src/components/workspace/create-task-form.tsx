"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createTask, type ActionState } from "@/app/actions/admin";

const initial: ActionState = {};

export default function CreateTaskForm({
  clients,
  employees,
  basePath = "/admin",
}: {
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; team: string | null }[];
  basePath?: string;
}) {
  const [state, formAction, pending] = useActionState(createTask, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push(`${basePath}/tasks`);
  }, [state, router, basePath]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Topic</label>
          <input name="topic" required className="input" placeholder="Diwali sale Instagram post" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Deadline</label>
          <input name="deadline" type="datetime-local" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Client</label>
          <select name="clientId" required className="input" defaultValue="">
            <option value="" disabled>Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Assign to</label>
          <select name="assignedToId" required className="input" defaultValue="">
            <option value="" disabled>Select team member</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.team === "DESIGN" ? " (Design)" : " (IT)"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          name="description"
          required
          rows={3}
          className="input"
          placeholder="What needs to be made, size, brand colors, references…"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">
          Reference link (optional) — e.g. brand assets or a Canva template
        </label>
        <input name="referenceLink" type="url" className="input" placeholder="https://canva.com/…" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Assigning…" : "Assign Task"}
      </button>
    </form>
  );
}
