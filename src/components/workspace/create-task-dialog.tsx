"use client";

import { useState } from "react";
import CreateTaskForm from "./create-task-form";

/** "Assign Task" button that opens the form in a modal — keeps the tasks
    page clean instead of showing the full form permanently. */
export default function CreateTaskDialog({
  clients,
  employees,
  taskTypes,
  basePath,
}: {
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; team: string | null; perPostPay: number | null }[];
  taskTypes: string[];
  basePath: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex shrink-0 items-center gap-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Assign Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-elevated p-7 shadow-lift">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink">Assign a task</h2>
                <p className="mt-0.5 text-sm font-medium text-muted">
                  Topic, deadline, client and assignee — the brief goes in the description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-xl p-2 text-white transition hover:bg-hover"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreateTaskForm
              clients={clients}
              employees={employees}
              taskTypes={taskTypes}
              basePath={basePath}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
