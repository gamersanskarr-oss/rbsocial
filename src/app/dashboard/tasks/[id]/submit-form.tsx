"use client";

import { useActionState } from "react";
import { submitTask, type SubmitState } from "@/app/actions/tasks";

const initial: SubmitState = {};

export default function SubmitTaskForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(submitTask, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="mb-1 block text-sm text-muted">
          Final design link (Canva, Drive, etc.)
        </label>
        <input
          name="submissionLink"
          type="url"
          required
          className="input"
          placeholder="https://canva.com/design/…"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Submitting…" : "Submit & Mark Completed"}
      </button>
    </form>
  );
}
