"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { submitMissReason, type SubmitState } from "@/app/actions/tasks";

const initial: SubmitState = {};

export default function ReasonForm({
  taskId,
  existing,
}: {
  taskId: string;
  existing: string | null;
}) {
  const [state, formAction, pending] = useActionState(submitMissReason, initial);
  useActionToast(state);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="missReason"
        required
        rows={3}
        maxLength={500}
        defaultValue={existing ?? ""}
        className="input"
        placeholder="e.g. Client sent the brand assets late, so the design took an extra day…"
      />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : existing ? "Update reason" : "Save reason"}
      </button>
    </form>
  );
}
