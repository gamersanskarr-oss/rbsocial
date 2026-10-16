"use client";

import { useActionState, useState } from "react";
import { applyForJob, type ApplyState } from "@/app/actions/careers";

const FLAME = "#c51c1a";
const initial: ApplyState = {};

export default function ApplySection({ jobs }: { jobs: { id: string; title: string }[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(applyForJob, initial);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (jobs.length === 0) return null;

  if (state.success) {
    return (
      <div className="mt-10 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-lg font-bold text-emerald-300">{state.success}</p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-medium text-ink placeholder:text-faint focus:border-white/30 focus:outline-none";

  return (
    <section id="apply" className="mt-14 rounded-3xl border border-line bg-panel/60 p-6 md:p-8">
      <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
        Apply in one go.
      </h2>
      <p className="mt-1.5 text-sm font-medium text-muted">
        Tick every role you're interested in — one form covers them all.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {state.error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300">
            {state.error}
          </p>
        )}

        {/* role picker */}
        <div className="flex flex-wrap gap-2">
          {jobs.map((j) => {
            const on = picked.includes(j.id);
            return (
              <label key={j.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="jobIds"
                  value={j.id}
                  checked={on}
                  onChange={() => toggle(j.id)}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    on
                      ? "border-transparent text-white"
                      : "border-line bg-elevated text-muted hover:text-ink"
                  }`}
                  style={on ? { background: `linear-gradient(135deg, ${FLAME}, #8f1410)` } : undefined}
                >
                  {on && "✓ "}
                  {j.title}
                </span>
              </label>
            );
          })}
        </div>

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
        <button
          type="submit"
          disabled={pending || picked.length === 0}
          className="rounded-full px-8 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${FLAME}, #8f1410)` }}
        >
          {pending
            ? "Sending…"
            : picked.length > 0
              ? `Apply for ${picked.length} role${picked.length === 1 ? "" : "s"} →`
              : "Pick a role above"}
        </button>
      </form>
    </section>
  );
}
