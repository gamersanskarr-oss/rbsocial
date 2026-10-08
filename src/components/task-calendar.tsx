"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createTask, type ActionState } from "@/app/actions/admin";

export type CalendarTask = {
  id: string;
  topic: string;
  status: string;
  deadline: string; // ISO
  clientName: string;
};

export type CalendarOption = { id: string; name: string; team?: string | null };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const chipStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200/70 hover:bg-amber-100",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200/70 hover:bg-emerald-100",
  MISSED: "bg-rose-50 text-rose-800 ring-rose-200/70 hover:bg-rose-100",
};

const dotStyles: Record<string, string> = {
  PENDING: "bg-amber-400",
  COMPLETED: "bg-emerald-500",
  MISSED: "bg-rose-500",
};

function AssignModal({
  date,
  clients,
  employees,
  onClose,
}: {
  date: { y: number; m: number; d: number };
  clients: CalendarOption[];
  employees: CalendarOption[];
  onClose: () => void;
}) {
  const initial: ActionState = {};
  const [state, formAction, pending] = useActionState(createTask, initial);

  useEffect(() => {
    if (state.success) onClose();
  }, [state, onClose]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateLabel = new Date(date.y, date.m, date.d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-7 shadow-lift">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">Assign task</h2>
            <p className="mt-0.5 text-sm font-medium text-muted">Deadline: {dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-faint transition hover:bg-hover hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && <p className="banner-error">{state.error}</p>}
          <input type="hidden" name="deadline" value={`${date.y}-${pad(date.m + 1)}-${pad(date.d)}T18:00`} />
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Topic</label>
            <input name="topic" required className="input" placeholder="Diwali sale Instagram post" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Client</label>
              <select name="clientId" required className="input" defaultValue="">
                <option value="" disabled>Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Assign to</label>
              <select name="assignedToId" required className="input" defaultValue="">
                <option value="" disabled>Select team member</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}{e.team === "DESIGN" ? " (Design)" : " (IT)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Description</label>
            <textarea
              name="description"
              required
              rows={3}
              className="input"
              placeholder="What needs to be made, size, brand colors, references…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">
              Reference link (optional)
            </label>
            <input name="referenceLink" type="url" className="input" placeholder="https://canva.com/…" />
          </div>
          <p className="text-xs font-medium text-faint">
            The deadline will be set to {dateLabel} at 6:00 PM.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Assigning…" : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TaskCalendar({
  tasks,
  basePath,
  canCreate = false,
  clients = [],
  employees = [],
}: {
  tasks: CalendarTask[];
  basePath?: string;
  canCreate?: boolean;
  clients?: CalendarOption[];
  employees?: CalendarOption[];
}) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [modalDay, setModalDay] = useState<{ y: number; m: number; d: number } | null>(null);

  const byDay = new Map<string, CalendarTask[]>();
  for (const t of tasks) {
    const d = new Date(t.deadline);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const first = new Date(view.y, view.m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const trailing = (7 - ((startOffset + daysInMonth) % 7)) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(startOffset),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array<null>(trailing),
  ];

  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const monthTasks = tasks.filter((t) => {
    const d = new Date(t.deadline);
    return d.getFullYear() === view.y && d.getMonth() === view.m;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => move(-1)}
            aria-label="Previous month"
            className="rounded-xl border border-line bg-white p-2 text-muted shadow-sm transition hover:bg-hover hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-hover"
          >
            Today
          </button>
          <button
            onClick={() => move(1)}
            aria-label="Next month"
            className="rounded-xl border border-line bg-white p-2 text-muted shadow-sm transition hover:bg-hover hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <span className="ml-2 text-sm font-bold text-ink">
            {MONTHS[view.m]} {view.y}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Missed</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-panel/70">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-faint">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const key = day ? `${view.y}-${view.m}-${day}` : `pad-${i}`;
            const isToday =
              day === now.getDate() && view.m === now.getMonth() && view.y === now.getFullYear();
            const dayTasks = day ? (byDay.get(`${view.y}-${view.m}-${day}`) ?? []) : [];
            const weekend = i % 7 === 0 || i % 7 === 6;
            const rowEnd = i % 7 === 6;

            return (
              <div
                key={key}
                onClick={canCreate && day ? () => setModalDay({ y: view.y, m: view.m, d: day }) : undefined}
                className={`group relative min-h-[92px] border-b border-line p-1.5 transition ${
                  rowEnd ? "" : "border-r"
                } ${!day ? "bg-panel/30" : ""} ${weekend && day ? "bg-panel/40" : ""} ${
                  canCreate && day ? "cursor-pointer hover:bg-hover/60" : ""
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-ink font-bold text-white" : "text-muted"
                      }`}
                    >
                      {day}
                    </span>
                    {canCreate && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-lg text-faint opacity-0 transition group-hover:opacity-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden>
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </span>
                    )}
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      {dayTasks.slice(0, 2).map((t) => {
                        const chip = (
                          <>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[t.status] ?? "bg-faint"}`} />
                            <span className="truncate">{t.topic}</span>
                          </>
                        );
                        const cls = `flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition ${
                          chipStyles[t.status] ?? "bg-panel text-muted ring-line"
                        }`;
                        return basePath ? (
                          <Link key={t.id} href={`${basePath}/${t.id}`} title={`${t.topic} · ${t.clientName}`} className={cls}>
                            {chip}
                          </Link>
                        ) : (
                          <div key={t.id} title={`${t.topic} · ${t.clientName}`} className={cls}>
                            {chip}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <p className="px-1.5 text-[11px] font-semibold text-faint">
                          +{dayTasks.length - 2} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-faint">
        {monthTasks.length} task{monthTasks.length === 1 ? "" : "s"} scheduled in {MONTHS[view.m]}.
        {canCreate && " Click any day to assign a task directly."}
      </p>

      {modalDay && (
        <AssignModal
          date={modalDay}
          clients={clients}
          employees={employees}
          onClose={() => setModalDay(null)}
        />
      )}
    </div>
  );
}
