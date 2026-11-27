"use client";

import { useMemo, useState } from "react";

export type ReportRow = {
  id: string;
  topic: string;
  type: string | null;
  slideCount: number | null;
  clientName: string;
  assigneeName: string;
  deadlineISO: string;
  status: string;
  approval?: string | null;
};

type SortKey = "type" | "client" | "assignee";

function SortTh({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
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

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function ReportsTable({
  rows,
  monthLabel,
  clients,
  employees,
  taskTypes,
}: {
  rows: ReportRow[];
  monthLabel: string;
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  taskTypes: string[];
}) {
  const [query, setQuery] = useState("");
  const [fClient, setFClient] = useState("");
  const [fAssignee, setFAssignee] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fType, setFType] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "client", dir: "asc" });

  const filtering = Boolean(query.trim() || fClient || fAssignee || fStatus || fType);

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (q && !r.topic.toLowerCase().includes(q)) return false;
      if (fClient && r.clientName !== fClient) return false;
      if (fAssignee && r.assigneeName !== fAssignee) return false;
      if (fStatus && r.status !== fStatus) return false;
      if (fType && r.type !== fType) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let c = 0;
      if (sort.key === "type") c = (a.type ?? "").localeCompare(b.type ?? "");
      else if (sort.key === "assignee") c = a.assigneeName.localeCompare(b.assigneeName);
      else c = a.clientName.localeCompare(b.clientName);
      if (c !== 0) return c * dir;
      return new Date(a.deadlineISO).getTime() - new Date(b.deadlineISO).getTime();
    });
    return out;
  }, [rows, query, fClient, fAssignee, fStatus, fType, sort]);

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

  // Exports exactly what the filters show — filter to one employee and the
  // download becomes that employee's monthly work report.
  const downloadCsv = () => {
    const header = ["Topic", "Deliverable", "Slides", "Client", "Assigned to", "Deadline", "Status"];
    const lines = filtered.map((r) => {
      const d = new Date(r.deadlineISO);
      return [
        csvCell(r.topic),
        csvCell(r.type ?? ""),
        csvCell(r.slideCount ?? ""),
        csvCell(r.clientName),
        csvCell(r.assigneeName),
        csvCell(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })),
        csvCell(r.status),
      ].join(",");
    });
    const csv = "\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rb-report-${monthLabel.replace(" ", "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setQuery("");
    setFClient("");
    setFAssignee("");
    setFStatus("");
    setFType("");
  };

  const selectCls = "input w-auto min-w-32 px-3 py-1.5 text-xs font-semibold";

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
        <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className={selectCls}>
          <option value="">All members</option>
          {employees.map((e) => (
            <option key={e.id} value={e.name}>
              {e.name}
            </option>
          ))}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
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
        <button
          type="button"
          onClick={downloadCsv}
          disabled={filtered.length === 0}
          title="Download the filtered report as Excel (CSV)"
          className="whitespace-nowrap rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel disabled:opacity-50"
        >
          Excel ↓
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line bg-panel/70">
            <tr>
              <SortTh label="Deliverable" k="type" sort={sort} onSort={onSort} />
              <SortTh label="Client" k="client" sort={sort} onSort={onSort} />
              <SortTh label="Assigned to" k="assignee" sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={3}>
                  No tasks due in {monthLabel}.
                </td>
              </tr>
            )}
            {rows.length > 0 && filtered.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={3}>
                  No tasks match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="transition hover:bg-panel/60">
                <td className="td">
                  {r.type ? (
                    <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand-line">
                      {r.type}
                      {r.slideCount ? ` · ${r.slideCount} slides` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </td>
                <td className="td font-medium text-ink">{r.clientName}</td>
                <td className="td text-muted">{r.assigneeName || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
