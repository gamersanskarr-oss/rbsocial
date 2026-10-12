"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addTaskType, createTask, type ActionState } from "@/app/actions/admin";

const initial: ActionState = {};

export default function CreateTaskForm({
  clients,
  employees,
  taskTypes,
  basePath = "/admin",
}: {
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; team: string | null; perPostPay: number | null }[];
  taskTypes: string[];
  basePath?: string;
}) {
  const [state, formAction, pending] = useActionState(createTask, initial);
  const router = useRouter();

  const [payAmt, setPayAmt] = useState("");
  const [newType, setNewType] = useState("");
  const [typeMsg, setTypeMsg] = useState<ActionState>({});
  const [addingType, startAddingType] = useTransition();

  useEffect(() => {
    if (state.success) router.push(`${basePath}/tasks`);
  }, [state, router, basePath]);

  const saveType = () => {
    const v = newType.trim();
    if (!v || addingType) return;
    startAddingType(async () => {
      const res = await addTaskType(v);
      setTypeMsg(res);
      if (res.success) setNewType("");
      router.refresh();
    });
  };

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Topic</label>
          <input name="topic" required className="input" placeholder="Diwali sale Instagram post" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Deadline</label>
          <input name="deadline" type="datetime-local" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Task type</label>
          <select name="taskType" required className="input" defaultValue="">
            <option value="" disabled>Select type</option>
            {taskTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="input flex-1 px-2.5 py-1.5 text-xs"
              placeholder="New category, e.g. Reels cover"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveType();
                }
              }}
            />
            <button
              type="button"
              onClick={saveType}
              disabled={addingType || !newType.trim()}
              className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel disabled:opacity-50"
            >
              {addingType ? "Adding…" : "+ Add"}
            </button>
          </div>
          {typeMsg.error && <p className="mt-1 text-xs font-medium text-bad">{typeMsg.error}</p>}
          {typeMsg.success && <p className="mt-1 text-xs font-medium text-ok">{typeMsg.success}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Client</label>
          <select name="clientId" required className="input" defaultValue="">
            <option value="" disabled>Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Assign to</label>
          <select
            name="assignedToId"
            required
            className="input"
            defaultValue=""
            onChange={(e) => {
              const emp = employees.find((x) => x.id === e.target.value);
              setPayAmt(emp?.perPostPay != null ? String(emp.perPostPay) : "");
            }}
          >
            <option value="" disabled>Select team member</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.team === "DESIGN" ? " (Design)" : " (IT)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Pay for this task (₹)</label>
          <input
            name="payAmount"
            type="number"
            min="0"
            step="1"
            className="input"
            placeholder="Defaults to per-post rate"
            value={payAmt}
            onChange={(e) => setPayAmt(e.target.value)}
          />
          <p className="mt-1 text-xs font-medium text-faint">
            Prefilled from the employee&apos;s rate — the assignee can adjust it when submitting if
            the task took extra work.
          </p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          name="description"
          required
          rows={3}
          className="input"
          placeholder="What needs to be made, size, brand colors, references…"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">
          Reference link (optional) — e.g. brand assets or a Canva template
        </label>
        <input name="referenceLink" type="url" className="input" placeholder="https://canva.com/…" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Assigning…" : "Assign Task"}
      </button>
    </form>
  );
}
