"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSelfTask } from "@/app/actions/tasks";
import { useToast } from "@/components/toast";

/** "Log urgent task" — employees can log work nobody assigned in the system.
    It lands straight in the review queue with their pay quote. */
export default function SelfTaskDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createSelfTask(fd);
        if (res.error) {
          toast("error", res.error);
          return;
        }
        toast("success", res.success ?? "Task logged.");
        setOpen(false);
        router.refresh();
      } catch {
        toast("error", "Could not log the task — try again.");
      }
    });
  };

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
        Log urgent task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-elevated p-7 shadow-lift">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink">Log urgent task</h2>
                <p className="mt-0.5 text-sm font-medium text-muted">
                  Work nobody assigned in the system — it goes to your manager for approval.
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

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Topic</label>
                <input name="topic" required className="input" placeholder="Urgent Diwali story set" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Client</label>
                <select name="clientId" required className="input" defaultValue="">
                  <option value="" disabled>
                    Select client
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] font-medium text-faint">
                  Only your assigned clients appear here.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Given by</label>
                <input
                  name="givenBy"
                  required
                  maxLength={60}
                  className="input"
                  placeholder="Who asked for this work, e.g. manager / client"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted">Quoted amount (₹)</label>
                  <input
                    name="payAmount"
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="input"
                    placeholder="Your quote"
                  />
                  <p className="mt-1 text-[11px] font-medium text-faint">
                    Final only after manager approval.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted">Google Drive link</label>
                  <input
                    name="submissionLink"
                    type="url"
                    required
                    className="input"
                    placeholder="https://drive.google.com/…"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">
                  Details (optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="input"
                  placeholder="What was made, size, context…"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Logging…" : "Log Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
