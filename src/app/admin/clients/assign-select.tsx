"use client";

import { assignClient } from "@/app/actions/admin";

export default function AssignSelect({
  clientId,
  currentIds,
  designers,
}: {
  clientId: string;
  currentIds: string[];
  designers: { id: string; name: string }[];
}) {
  const names = designers.filter((d) => currentIds.includes(d.id)).map((d) => d.name);

  return (
    <details className="group relative">
      <summary className="flex w-44 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-line bg-elevated px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-panel [&::-webkit-details-marker]:hidden">
        <span className={`truncate ${names.length ? "text-ink" : "text-faint"}`}>
          {names.length ? names.join(", ") : "Unassigned"}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-faint transition group-open:rotate-180">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <form
        action={assignClient}
        className="absolute right-0 z-30 mt-1.5 w-48 space-y-1 rounded-xl border border-line bg-elevated p-2 shadow-lift"
      >
        <input type="hidden" name="clientId" value={clientId} />
        {designers.map((d) => (
          <label
            key={d.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink transition hover:bg-panel"
          >
            <input
              type="checkbox"
              name="assignedToIds"
              value={d.id}
              defaultChecked={currentIds.includes(d.id)}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-3.5 w-3.5 accent-brand"
            />
            {d.name}
          </label>
        ))}
        {designers.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-faint">No designers yet.</p>
        )}
      </form>
    </details>
  );
}
