"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createTask, type ActionState } from "@/app/actions/admin";
import { moveTaskDeadline } from "@/app/actions/tasks";

export type CalendarTask = {
  id: string;
  topic: string;
  status: string;
  deadline: string; // ISO
  clientName: string;
  assignee?: string | null;
  type?: string | null;
  slideCount?: number | null;
};

export type CalendarOption = { id: string; name: string; team?: string | null; perPostPay?: number | null };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const chipStyles: Record<string, string> = {
  PENDING: "bg-warn-soft text-warn ring-warn-line hover:bg-warn-soft/60",
  COMPLETED: "bg-ok-soft text-ok ring-ok-line hover:bg-ok-soft/60",
  MISSED: "bg-bad-soft text-bad ring-bad-line hover:bg-bad-soft/60",
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
  taskTypes,
  canSetPay,
  onClose,
}: {
  date: { y: number; m: number; d: number };
  clients: CalendarOption[];
  employees: CalendarOption[];
  taskTypes: string[];
  canSetPay: boolean;
  onClose: () => void;
}) {
  const initial: ActionState = {};
  const [state, formAction, pending] = useActionState(createTask, initial);
  const [selType, setSelType] = useState("");
  const [payAmt, setPayAmt] = useState("");

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
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-elevated p-7 shadow-lift">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">Assign task</h2>
            <p className="mt-0.5 text-sm font-medium text-muted">Deadline: {dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-white transition hover:bg-hover"
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
              <label className="mb-1 block text-sm font-medium text-muted">Task type</label>
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
                <input
                  name="slideCount"
                  type="number"
                  min="1"
                  max="99"
                  required
                  className="input mt-2 px-2.5 py-1.5 text-xs"
                  placeholder="Number of slides, e.g. 8"
                />
              )}
            </div>
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
          </div>
          {canSetPay && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">
                Pay for this task (₹) — optional
              </label>
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
            </div>
          )}
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
  canSetPay = false,
  clients = [],
  employees = [],
  taskTypes = [],
}: {
  tasks: CalendarTask[];
  basePath?: string;
  canCreate?: boolean;
  canSetPay?: boolean;
  clients?: CalendarOption[];
  employees?: CalendarOption[];
  taskTypes?: string[];
}) {
  const now = new Date();
  const router = useRouter();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [modalDay, setModalDay] = useState<{ y: number; m: number; d: number } | null>(null);
  const [fClient, setFClient] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fAssignee, setFAssignee] = useState("");

  // Drag-to-reschedule (admin/manager calendars only — gated by canCreate)
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [moved, setMoved] = useState<Record<string, Date>>({}); // taskId -> new deadline (optimistic)
  const [, startMove] = useTransition();

  // Client filter options: prefer the option list, else derive from tasks
  const clientNames = clients.length
    ? clients.map((c) => c.name)
    : [...new Set(tasks.map((t) => t.clientName))];
  const showAssigneeFilter = employees.length > 0 && tasks.some((t) => t.assignee);

  const filteredTasks = tasks.filter((t) => {
    if (fClient && t.clientName !== fClient) return false;
    if (fStatus && t.status !== fStatus) return false;
    if (fAssignee && t.assignee !== fAssignee) return false;
    return true;
  });
  const filtering = Boolean(fClient || fStatus || fAssignee);

  const byDay = new Map<string, CalendarTask[]>();
  for (const t of filteredTasks) {
    const d = moved[t.id] ?? new Date(t.deadline);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const dropTask = (taskId: string, day: number) => {
    // keep the original time-of-day, move the date
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const next = new Date(t.deadline);
    next.setFullYear(view.y, view.m, day);
    const iso = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setMoved((m) => ({ ...m, [taskId]: next }));
    setDropKey(null);
    setDragId(null);
    startMove(async () => {
      await moveTaskDeadline(taskId, iso);
      router.refresh();
    });
  };

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

  const monthTasks = filteredTasks.filter((t) => {
    const d = moved[t.id] ?? new Date(t.deadline);
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
            className="rounded-xl border border-line bg-elevated p-2 text-white shadow-sm transition hover:bg-hover"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
            title="Back to current month"
            className="min-w-32 rounded-xl border border-line bg-elevated px-3.5 py-2 text-sm font-bold text-ink shadow-sm transition hover:bg-hover"
          >
            {MONTHS[view.m]} <span className="text-faint">{view.y}</span>
          </button>
          <button
            onClick={() => move(1)}
            aria-label="Next month"
            className="rounded-xl border border-line bg-elevated p-2 text-white shadow-sm transition hover:bg-hover"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={fClient}
            onChange={(e) => setFClient(e.target.value)}
            className="input w-auto min-w-36 px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">All clients</option>
            {clientNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {showAssigneeFilter && (
            <select
              value={fAssignee}
              onChange={(e) => setFAssignee(e.target.value)}
              className="input w-auto min-w-36 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="">All members</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          )}
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="input w-auto px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
          {filtering && (
            <button
              type="button"
              onClick={() => { setFClient(""); setFStatus(""); setFAssignee(""); }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted transition hover:bg-hover hover:text-ink"
            >
              Clear
            </button>
          )}
          <div className="hidden items-center gap-4 text-xs font-medium text-muted lg:flex">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Missed</span>
          </div>
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

            const dayKey = day ? `${view.y}-${view.m}-${day}` : null;
            return (
              <div
                key={key}
                onClick={canCreate && day ? () => setModalDay({ y: view.y, m: view.m, d: day }) : undefined}
                onDragOver={canCreate && day ? (e) => { if (dragId) { e.preventDefault(); setDropKey(dayKey); } } : undefined}
                onDragLeave={canCreate && day ? () => { if (dropKey === dayKey) setDropKey(null); } : undefined}
                onDrop={canCreate && day ? (e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/task-id") || dragId;
                  if (id) dropTask(id, day);
                } : undefined}
                className={`group relative min-h-[92px] border-b border-line p-1.5 transition ${
                  rowEnd ? "" : "border-r"
                } ${!day ? "bg-panel/30" : ""} ${weekend && day ? "bg-panel/40" : ""} ${
                  canCreate && day ? "cursor-pointer hover:bg-hover/60" : ""
                } ${dropKey && dropKey === dayKey ? "bg-hover/80 ring-1 ring-inset ring-brand-line" : ""}`}
              >
                {day && (
                  <>
                    <span
                      className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-ink font-bold text-canvas" : "text-muted"
                      }`}
                    >
                      {day}
                    </span>
                    {canCreate && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-lg text-white opacity-0 transition group-hover:opacity-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden>
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </span>
                    )}
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      {dayTasks.slice(0, 2).map((t) => {
                        // Optimistic status after a drag: past deadline = missed, future = pending
                        const movedDate = moved[t.id];
                        const st = movedDate
                          ? movedDate.getTime() < Date.now()
                            ? "MISSED"
                            : t.status === "MISSED"
                              ? "PENDING"
                              : t.status
                          : t.status;
                        const label = t.type
                          ? `${t.type}${t.slideCount ? ` · ${t.slideCount}` : ""}`
                          : "Task";
                        const dl = new Date(movedDate ?? t.deadline);
                        const chip = (
                          <>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[st] ?? "bg-faint"}`} />
                            <span className="truncate">{label}</span>
                          </>
                        );
                        const cls = `flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition ${
                          chipStyles[st] ?? "bg-panel text-muted ring-line"
                        } ${canCreate ? "cursor-grab active:cursor-grabbing" : ""} ${dragId === t.id ? "opacity-40" : ""}`;
                        const dragProps = canCreate
                          ? {
                              draggable: true,
                              onDragStart: (e: React.DragEvent) => {
                                e.dataTransfer.setData("text/task-id", t.id);
                                e.dataTransfer.effectAllowed = "move";
                                setDragId(t.id);
                              },
                              onDragEnd: () => { setDragId(null); setDropKey(null); },
                            }
                          : {};
                        // Tooltip flips up on lower rows, and aligns to the nearer edge
                        const row = Math.floor(i / 7);
                        const vert = row < 3 ? "top-full mt-1.5" : "bottom-full mb-1.5";
                        const horiz =
                          i % 7 >= 5 ? "right-0" : i % 7 <= 1 ? "left-0" : "left-1/2 -translate-x-1/2";
                        const tooltip = (
                          <span
                            className={`pointer-events-none absolute z-50 hidden w-44 rounded-xl border border-line bg-elevated p-3 text-left shadow-lift group-hover/task:block ${vert} ${horiz}`}
                          >
                            <span className="block text-[11px] font-bold leading-snug text-ink">
                              {t.topic}
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold text-muted">
                              {t.clientName}
                              {t.assignee ? ` · ${t.assignee}` : ""}
                            </span>
                            <span className="mt-1 block text-[10px] font-medium text-faint">
                              {dl.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {t.type ? ` · ${t.type}${t.slideCount ? ` · ${t.slideCount} slides` : ""}` : ""}
                              {` · ${st.charAt(0)}${st.slice(1).toLowerCase()}`}
                            </span>
                          </span>
                        );
                        const inner = basePath ? (
                          <Link href={`${basePath}/${t.id}`} className={cls} {...dragProps}>
                            {chip}
                          </Link>
                        ) : (
                          <div className={cls} {...dragProps}>
                            {chip}
                          </div>
                        );
                        return (
                          <div key={t.id} className="group/task relative">
                            {inner}
                            {tooltip}
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
        {canCreate && " Click a day to assign a task, or drag a task to another day to reschedule."}
      </p>

      {modalDay && (
        <AssignModal
          date={modalDay}
          clients={clients}
          employees={employees}
          taskTypes={taskTypes}
          canSetPay={canSetPay}
          onClose={() => setModalDay(null)}
        />
      )}
    </div>
  );
}
