"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createTask, type ActionState } from "@/app/actions/admin";

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
  const [selType, setSelType] = useState("");

  useEffect(() => {
    if (state.success) router.push(`${basePath}/tasks`);
  }, [state, router, basePath]);

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
          <select
            name="taskType"
            required
            className="input"
            value={selType}
            onChange={(e) => setSelType(e.target.value)}
          >
            <option value="" disabled>Select type</option>
            {taskTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {selType === "Carousel" && (
            <div className="mt-2">
              <input
                name="slideCount"
                type="number"
                min="1"
                max="99"
                required
                className="input px-2.5 py-1.5 text-xs"
                placeholder="Number of slides, e.g. 8"
              />
            </div>
          )}
          <p className="mt-1.5 text-[11px] font-medium text-faint">
            Missing a type? Add it in the Task categories box →
          </p>
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
        {basePath === "/admin" && (
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
        )}
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
