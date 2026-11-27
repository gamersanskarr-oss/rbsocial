"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { DueTime } from "@/components/due-time";
import { useToast } from "@/components/toast";
import { deleteTask } from "@/app/actions/tasks";

export type TaskRow = {
  id: string;
  topic: string;
  description: string;
  type: string | null;
  slideCount: number | null;
  clientName: string;
  assigneeName: string;
  deadlineISO: string;
  status: string;
  approval: string | null;
  lateSubmission: boolean;
  missReason: string | null;
  submissionLink: string | null;
  requestsCount: number;
  payStatus: string | null;
  payAmount: number | null;
  /** Employee's own pay for this task (quote or approved) — null when nothing
      is fixed yet (task not submitted). */
  pay?: number | null;
  /** The employee's original quote, preserved when the manager approves a
      different amount. */
  quotedAmount?: number | null;
  selfAssigned?: boolean | null;
  selfAssignedBy?: string | null;
};

type SortKey = "topic" | "client" | "assignee" | "deadline" | "status";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const STATUS_ORDER: Record<string, number> = { PENDING: 0, MISSED: 1, COMPLETED: 2 };

function SortTh({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <th className="th">
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex cursor-pointer items-center gap-1 uppercase tracking-wider transition hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 transition ${active ? (sort.dir === "asc" ? "" : "rotate-180") : "opacity-0"}`}
          aria-hidden
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </th>
  );
}

/** Two-step delete: trash icon -> inline Confirm/Cancel. The server action
    blocks nothing here (admin/manager only) but surfaces errors as toasts. */
function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Delete task"
        className="rounded-lg p-1.5 text-faint transition hover:bg-bad-soft hover:text-bad"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    );
  }

  const confirm = () => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    startTransition(async () => {
      try {
        const res = await deleteTask(fd);
        if (res?.error) {
          toast("error", res.error);
          setConfirming(false);
          return;
        }
        toast("success", "Task deleted.");
        router.refresh();
      } catch {
        toast("error", "Could not delete the task — try again.");
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        title="Confirm deletion"
        className="whitespace-nowrap rounded-lg bg-bad-soft px-2 py-1 text-[10px] font-bold text-bad ring-1 ring-inset ring-bad-line transition hover:bg-bad-soft/60 disabled:opacity-50"
      >
        {pending ? "…" : "Confirm?"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-lg px-1.5 py-1 text-[10px] font-semibold text-muted transition hover:bg-hover hover:text-ink"
      >
        ✕
      </button>
    </span>
  );
}

export default function TasksTable({
  basePath,
  rows,
  clients,
  employees,
  taskTypes,
  canSeePay = false,
  canManage = true,
  showPay = false,
}: {
  basePath: string;
  rows: TaskRow[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string; team?: string | null }[];
  taskTypes: string[];
  canSeePay?: boolean;
  /** Edit + delete actions — employees view their own tasks, they don't manage them. */
  canManage?: boolean;
  /** Per-task pay column (employee's own quoted/approved amounts). */
  showPay?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [fClient, setFClient] = useState("");
  const [fAssignee, setFAssignee] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fType, setFType] = useState("");
  const [fApproval, setFApproval] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "deadline", dir: "asc" });

  const filtering = Boolean(
    query.trim() || fClient || fAssignee || fStatus || fType || fApproval || fDeadline,
  );

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const weekEnd = now.getTime() + 7 * 24 * 36e5;

    const out = rows.filter((r) => {
      if (q && !`${r.topic} ${r.description}`.toLowerCase().includes(q)) return false;
      if (fClient && r.clientName !== fClient) return false;
      if (fAssignee && r.assigneeName !== fAssignee) return false;
      if (fStatus) {
        if (fStatus === "REVIEW") {
          if (!(r.status === "COMPLETED" && r.approval === "PENDING")) return false;
        } else if (fStatus === "APPROVED") {
          if (
            !(
              r.status === "COMPLETED" &&
              (!r.approval || r.approval === "NONE" || r.approval === "APPROVED")
            )
          )
            return false;
        } else if (r.status !== fStatus) return false;
      }
      if (fType && r.type !== fType) return false;
      if (fApproval && (r.approval ?? "NONE") !== fApproval) return false;
      if (fDeadline) {
        const d = new Date(r.deadlineISO);
        const dKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (fDeadline === "overdue" && !(r.status === "PENDING" && d.getTime() < now.getTime())) return false;
        if (fDeadline === "today" && dKey !== todayKey) return false;
        if (fDeadline === "week" && !(d.getTime() >= now.getTime() && d.getTime() <= weekEnd)) return false;
        if (fDeadline === "month" && `${d.getFullYear()}-${d.getMonth()}` !== `${now.getFullYear()}-${now.getMonth()}`)
          return false;
      }
      return true;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let c = 0;
      if (sort.key === "deadline") {
        c = new Date(a.deadlineISO).getTime() - new Date(b.deadlineISO).getTime();
      } else if (sort.key === "status") {
        c = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      } else if (sort.key === "client") {
        c = a.clientName.localeCompare(b.clientName);
      } else if (sort.key === "assignee") {
        c = a.assigneeName.localeCompare(b.assigneeName);
      } else {
        c = a.topic.toLowerCase().localeCompare(b.topic.toLowerCase());
      }
      if (c !== 0) return c * dir;
      return new Date(a.deadlineISO).getTime() - new Date(b.deadlineISO).getTime();
    });
    return out;
  }, [rows, query, fClient, fAssignee, fStatus, fType, fApproval, fDeadline, sort]);

  const stats = useMemo(
    () =>
      filtered.reduce(
        (s, r) => ({
          total: s.total + 1,
          pending: s.pending + (r.status === "PENDING" ? 1 : 0),
          review:
            s.review + (r.status === "COMPLETED" && r.approval === "PENDING" ? 1 : 0),
          approved:
            s.approved +
            (r.status === "COMPLETED" && (!r.approval || r.approval === "NONE" || r.approval === "APPROVED")
              ? 1
              : 0),
          missed: s.missed + (r.status === "MISSED" ? 1 : 0),
        }),
        { total: 0, pending: 0, review: 0, approved: 0, missed: 0 },
      ),
    [filtered],
  );

  const clear = () => {
    setQuery("");
    setFClient("");
    setFAssignee("");
    setFStatus("");
    setFType("");
    setFApproval("");
    setFDeadline("");
  };

  const selectCls = "input w-auto min-w-32 px-3 py-1.5 text-xs font-semibold";
  const colCount = 8 + (showPay ? 1 : 0);

  return (
    <div className="card overflow-hidden">
      {/* Counters — reflect the current filters */}
      <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total tasks", value: stats.total },
          { label: "Pending", value: stats.pending, dot: "bg-amber-400" },
          { label: "In review", value: stats.review, dot: "bg-sky-400" },
          { label: "Approved", value: stats.approved, dot: "bg-emerald-500" },
          { label: "Missed", value: stats.missed, dot: "bg-rose-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel p-3.5">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
              {s.dot && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
              {s.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="input w-auto min-w-44 px-3 py-1.5 text-xs font-semibold"
        />
        <select value={fClient} onChange={(e) => setFClient(e.target.value)} className={selectCls}>
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {employees.length > 0 && (
          <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className={selectCls}>
            <option value="">All members</option>
            {employees.map((e) => (
              <option key={e.id} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEW">In review</option>
          <option value="APPROVED">Approved</option>
          <option value="MISSED">Missed</option>
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value)} className={selectCls}>
          <option value="">All deliverables</option>
          {taskTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={fApproval} onChange={(e) => setFApproval(e.target.value)} className={selectCls}>
          <option value="">All reviews</option>
          <option value="PENDING">Needs review</option>
          <option value="APPROVED">Approved</option>
          <option value="CHANGES">Sent back</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={fDeadline} onChange={(e) => setFDeadline(e.target.value)} className={selectCls}>
          <option value="">Any deadline</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Due this week</option>
          <option value="month">Due this month</option>
        </select>
        {filtering && (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted transition hover:bg-hover hover:text-ink"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs font-medium text-faint">
          {filtered.length} of {rows.length} tasks
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line bg-panel/70">
            <tr>
              <SortTh label="Topic" k="topic" sort={sort} onSort={onSort} />
              <th className="th">Type</th>
              <SortTh label="Client" k="client" sort={sort} onSort={onSort} />
              <SortTh label="Assigned to" k="assignee" sort={sort} onSort={onSort} />
              <SortTh label="Deadline" k="deadline" sort={sort} onSort={onSort} />
              <SortTh label="Status" k="status" sort={sort} onSort={onSort} />
              {showPay && <th className="th">Pay (₹)</th>}
              <th className="th">Requests</th>
              <th className="th">Submission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={colCount}>
                  No tasks yet — assign the first one above.
                </td>
              </tr>
            )}
            {rows.length > 0 && filtered.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={colCount}>
                  No tasks match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((t) => {
              const overdue = t.status === "PENDING" && new Date(t.deadlineISO) < new Date();
              return (
                <tr key={t.id} className="transition hover:bg-panel/60">
                  <td className="td max-w-56">
                    <Link
                      href={`${basePath}/tasks/${t.id}`}
                      className="block truncate font-semibold text-ink transition hover:text-brand"
                    >
                      {t.topic}
                    </Link>
                    <p className="truncate text-xs text-faint">{t.description}</p>
                    {t.selfAssigned && (
                      <span
                        title={t.selfAssignedBy ? `Logged by employee · given by: ${t.selfAssignedBy}` : "Logged by the employee"}
                        className="mt-1 inline-block whitespace-nowrap rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-bold text-info ring-1 ring-inset ring-info-line"
                      >
                        self{t.selfAssignedBy ? ` · ${t.selfAssignedBy}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="td">
                    {t.type ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand-line">
                        {t.type}
                        {t.slideCount ? ` · ${t.slideCount} slides` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                  <td className="td font-medium text-ink">{t.clientName}</td>
                  <td className="td text-muted">{t.assigneeName}</td>
                  <td className={`td ${overdue ? "font-bold text-bad" : "text-muted"}`}>
                    <DueTime iso={t.deadlineISO} />
                  </td>
                  <td className="td">
                    <StatusBadge status={t.status} approval={t.approval} />
                    {t.status === "COMPLETED" && t.approval === "PENDING" && (
                      <Link
                        href={`${basePath}/tasks/${t.id}`}
                        className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-bold text-info ring-1 ring-inset ring-info-line hover:bg-info-soft/60"
                        title="Submission waiting for your review"
                      >
                        👁 review
                      </Link>
                    )}
                    {canSeePay && t.payStatus === "PENDING" && (
                      <Link
                        href={`${basePath}/tasks/${t.id}`}
                        className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn ring-1 ring-inset ring-warn-line hover:bg-warn-soft/60"
                        title="Employee's quoted amount is waiting for approval"
                      >
                        ₹{t.payAmount} quote
                      </Link>
                    )}
                    {t.lateSubmission && (
                      <span
                        className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn ring-1 ring-inset ring-warn-line"
                        title="Submitted after the deadline — counted as a missed deadline"
                      >
                        missed
                      </span>
                    )}
                    {t.missReason && (
                      <span
                        className="ml-1.5 inline-block cursor-help whitespace-nowrap rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold text-muted ring-1 ring-inset ring-line"
                        title={t.missReason}
                      >
                        💬 why
                      </span>
                    )}
                  </td>
                  {showPay && (
                    <td className="td whitespace-nowrap">
                      {t.pay != null ? (
                        <div className="leading-tight">
                          <span
                            className={`block font-bold ${
                              t.payStatus === "APPROVED"
                                ? "text-ok"
                                : t.payStatus === "PENDING"
                                  ? "text-warn"
                                  : "text-ink"
                            }`}
                            title={
                              t.payStatus === "APPROVED"
                                ? "Approved amount"
                                : t.payStatus === "PENDING"
                                  ? "Your quoted amount — awaiting admin approval"
                                  : "Base rate"
                            }
                          >
                            ₹{t.pay.toLocaleString("en-IN")}
                          </span>
                          {/* Manager approved a different figure than the quote → show both */}
                          {t.payStatus === "APPROVED" &&
                          t.quotedAmount != null &&
                          t.quotedAmount !== t.pay ? (
                            <span className="block text-[10px] font-medium text-faint">
                              quoted ₹{t.quotedAmount.toLocaleString("en-IN")}
                            </span>
                          ) : t.payStatus === "PENDING" ? (
                            <span className="block text-[10px] font-medium text-faint">
                              awaiting admin approval
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  )}
                  <td className="td">
                    {t.requestsCount > 0 ? (
                      <Link
                        href={`${basePath}/requests`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-line hover:bg-warn-soft/60"
                      >
                        {t.requestsCount} open
                      </Link>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      {t.submissionLink ? (
                        <a href={t.submissionLink} target="_blank" rel="noreferrer" className="link">
                          View design ↗
                        </a>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                      {canManage && (
                        <Link
                          href={`${basePath}/tasks/${t.id}`}
                          title="Edit task"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-hover hover:text-ink"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </Link>
                      )}
                      {canManage && <DeleteTaskButton taskId={t.id} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
