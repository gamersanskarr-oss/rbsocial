"use client";

import { useActionState } from "react";
import { addTaskRequest, type RequestState } from "@/app/actions/requests";

const initial: RequestState = {};

export default function RequestForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addTaskRequest, initial);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="taskId" value={taskId} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="message"
          required
          maxLength={300}
          className="input sm:flex-1"
          placeholder="e.g. Need the client's logo file and brand colors"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          {pending ? "Sending…" : "Send Request"}
        </button>
      </div>
      <p className="text-xs font-medium text-faint">
        Requests close in the last 6 hours before the deadline — ask early.
      </p>
    </form>
  );
}
