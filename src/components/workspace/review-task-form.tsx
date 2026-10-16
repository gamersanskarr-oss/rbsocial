"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { reviewTask, type SubmitState } from "@/app/actions/tasks";

const initial: SubmitState = {};

const options = [
  {
    value: "approve",
    label: "✓ Approve",
    active: "border-emerald-500/60 bg-emerald-500/15 text-emerald-400",
    idle: "border-line bg-panel text-muted hover:text-ink",
  },
  {
    value: "changes",
    label: "✏️ Changes needed",
    active: "border-amber-500/60 bg-amber-500/15 text-amber-400",
    idle: "border-line bg-panel text-muted hover:text-ink",
  },
  {
    value: "reject",
    label: "✗ Reject",
    active: "border-rose-500/60 bg-rose-500/15 text-rose-400",
    idle: "border-line bg-panel text-muted hover:text-ink",
  },
];

export default function ReviewTaskForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(reviewTask, initial);
  const router = useRouter();
  const [decision, setDecision] = useState("");

  return (
    <form
      action={formAction}
      onSubmit={() => setTimeout(() => router.refresh(), 300)}
      className="mt-4 space-y-3 border-t border-line pt-4"
    >
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="decision" value={decision} />

      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
        Review this submission
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setDecision(o.value)}
            className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
              decision === o.value ? o.active : o.idle
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {decision && decision !== "approve" && (
        <div>
          <textarea
            name="reviewNote"
            required
            rows={2}
            className="input text-sm"
            placeholder={
              decision === "changes"
                ? "What should be changed? e.g. fix the logo size and caption"
                : "Why is this rejected? The employee will see this note."
            }
          />
        </div>
      )}
      {decision === "approve" && (
        <input
          name="reviewNote"
          className="input text-sm"
          placeholder="Optional note, e.g. great work!"
        />
      )}

      {decision && (
        <button type="submit" disabled={pending} className="btn-primary w-full py-2 text-sm">
          {pending
            ? "Saving…"
            : decision === "approve"
              ? "Approve submission"
              : decision === "changes"
                ? "Send back for changes"
                : "Reject submission"}
        </button>
      )}
    </form>
  );
}
