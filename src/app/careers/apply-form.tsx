"use client";

import { useActionState, useState } from "react";
import { applyForJob, type ApplyState } from "@/app/actions/careers";

const FLAME = "#c51c1a";
const initial: ApplyState = {};

export default function ApplyForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(applyForJob, initial);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-300">
        {state.success}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white transition duration-200 hover:opacity-90 active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, ${FLAME}, #8f1410)` }}
      >
        Apply →
      </button>
    );
  }

  const field =
    "w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-medium text-ink placeholder:text-faint focus:border-white/30 focus:outline-none";

  return (
    <form action={formAction} className="mt-2 w-full space-y-3 border-t border-line pt-5">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobTitle" value={jobTitle} />
      <p className="text-sm font-bold text-ink">
        Apply for <span style={{ color: FLAME }}>{jobTitle}</span>
      </p>
      {state.error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required maxLength={100} placeholder="Your name *" className={field} />
        <input
          name="email"
          type="email"
          required
          maxLength={150}
          placeholder="Email *"
          className={field}
        />
        <input name="phone" maxLength={25} placeholder="Phone / WhatsApp" className={field} />
        <input
          name="portfolio"
          maxLength={300}
          placeholder="Portfolio / Behance / LinkedIn link"
          className={field}
        />
      </div>
      <textarea
        name="message"
        rows={3}
        maxLength={2000}
        placeholder="Anything we should know? (optional)"
        className={field}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${FLAME}, #8f1410)` }}
        >
          {pending ? "Sending…" : "Send application"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-muted transition hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
