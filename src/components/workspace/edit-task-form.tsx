"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateTask, type SubmitState } from "@/app/actions/tasks";

const initial: SubmitState = {};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export type EditableTask = {
  id: string;
  topic: string;
  description: string;
  clientId: string;
  assignedToId: string;
  deadline: string; // ISO
  type: string | null;
  slideCount: number | null;
  status: string;
  referenceLink: string | null;
  submissionLink: string | null;
  payAmount: number | null;
};

export default function EditTaskForm({
  task,
  clients,
  employees,
  taskTypes,
  isAdmin,
}: {
  task: EditableTask;
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; team: string | null }[];
  taskTypes: string[];
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateTask, initial);
  const router = useRouter();
  const [selType, setSelType] = useState(task.type ?? "");

  return (
    <form
      action={formAction}
      onSubmit={() => setTimeout(() => router.refresh(), 300)}
      className="space-y-4"
    >
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <input type="hidden" name="taskId" value={task.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Topic</label>
          <input name="topic" required className="input" defaultValue={task.topic} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Deadline</label>
          <input
            name="deadline"
            type="datetime-local"
            required
            className="input"
            defaultValue={toLocalInput(task.deadline)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Task type</label>
          <select
            name="taskType"
            required
            className="input"
            value={selType}
            onChange={(e) => setSelType(e.target.value)}
          >
            {taskTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {selType === "Carousel" && (
            <input
              name="slideCount"
              type="number"
              min="1"
              max="99"
              required
              className="input mt-2 px-2.5 py-1.5 text-xs"
              placeholder="Number of slides, e.g. 8"
              defaultValue={task.slideCount ?? ""}
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Status</label>
          <select name="status" required className="input" defaultValue={task.status}>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Client</label>
          <select name="clientId" required className="input" defaultValue={task.clientId}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Assign to</label>
          <select name="assignedToId" required className="input" defaultValue={task.assignedToId}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.team === "DESIGN" ? " (Design)" : " (IT)"}
              </option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm text-muted">Pay for this task (₹)</label>
            <input
              name="payAmount"
              type="number"
              min="0"
              step="1"
              className="input"
              placeholder="Blank = per-post rate"
              defaultValue={task.payAmount ?? ""}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea name="description" required rows={3} className="input" defaultValue={task.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Reference link (optional)</label>
          <input name="referenceLink" type="url" className="input" defaultValue={task.referenceLink ?? ""} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Submission link</label>
          <input name="submissionLink" type="url" className="input" defaultValue={task.submissionLink ?? ""} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
