"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AssignSelect from "@/app/admin/clients/assign-select";

export type ClientRow = {
  id: string;
  name: string;
  archived: boolean;
  contact: string | null;
  socials: { label: string; url: string }[];
  assigneeIds: string[];
  assigneeNames: string[];
  taskTotal: number;
  pending: number;
  completed: number;
  missed: number;
  types: string[];
};

type SortKey = "name" | "contact" | "tasks" | "assignee";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const statusMeta: Record<string, { dot: string; label: string }> = {
  pending: { dot: "bg-amber-400", label: "pending" },
  completed: { dot: "bg-emerald-500", label: "done" },
  missed: { dot: "bg-rose-500", label: "missed" },
};

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

function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  );
}

export default function ClientsTable({
  basePath,
  rows,
  employees,
  taskTypes,
}: {
  basePath: string;
  rows: ClientRow[];
  employees: { id: string; name: string; team?: string | null }[];
  taskTypes: string[];
}) {
  const [query, setQuery] = useState("");
  const [fDesigner, setFDesigner] = useState("");
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });

  const filtering = Boolean(query.trim() || fDesigner || fType || fStatus);

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (fDesigner === "unassigned" ? r.assigneeIds.length > 0 : fDesigner && !r.assigneeIds.includes(fDesigner))
        return false;
      if (fType && !r.types.includes(fType)) return false;
      if (fStatus && r[fStatus as "pending" | "completed" | "missed"] === 0) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (sort.key === "tasks") {
        va = a.taskTotal;
        vb = b.taskTotal;
      } else if (sort.key === "assignee") {
        va = a.assigneeNames[0] ?? "";
        vb = b.assigneeNames[0] ?? "";
      } else if (sort.key === "contact") {
        va = a.contact ?? "";
        vb = b.contact ?? "";
      } else {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      }
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    return out;
  }, [rows, query, fDesigner, fType, fStatus, sort]);

  const clear = () => {
    setQuery("");
    setFDesigner("");
    setFType("");
    setFStatus("");
  };

  // Counters follow the filters — they describe the clients you're looking at.
  const stats = useMemo(
    () =>
      filtered.reduce(
        (s, r) => ({
          clients: s.clients + 1,
          tasks: s.tasks + r.taskTotal,
          completed: s.completed + r.completed,
          pending: s.pending + r.pending,
          missed: s.missed + r.missed,
        }),
        { clients: 0, tasks: 0, completed: 0, pending: 0, missed: 0 },
      ),
    [filtered],
  );

  return (
    <div className="card overflow-hidden">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Clients" value={stats.clients} />
        <Stat label="Total tasks" value={stats.tasks} />
        <Stat label="Completed" value={stats.completed} dot="bg-emerald-500" />
        <Stat label="Pending" value={stats.pending} dot="bg-amber-400" />
        <Stat label="Missed" value={stats.missed} dot="bg-rose-500" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients…"
          className="input w-auto min-w-44 px-3 py-1.5 text-xs font-semibold"
        />
        <select
          value={fDesigner}
          onChange={(e) => setFDesigner(e.target.value)}
          className="input w-auto min-w-36 px-3 py-1.5 text-xs font-semibold"
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.team ? ` (${e.team === "DESIGN" ? "Design" : e.team === "IT" ? "IT" : e.team})` : ""}
            </option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>
        <select
          value={fType}
          onChange={(e) => setFType(e.target.value)}
          className="input w-auto min-w-36 px-3 py-1.5 text-xs font-semibold"
        >
          <option value="">All deliverables</option>
          {taskTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="input w-auto min-w-36 px-3 py-1.5 text-xs font-semibold"
        >
          <option value="">All statuses</option>
          <option value="pending">Has pending</option>
          <option value="completed">Has completed</option>
          <option value="missed">Has missed</option>
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
          {filtered.length} of {rows.length} clients
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line bg-panel/70">
            <tr>
              <SortTh label="Client" k="name" sort={sort} onSort={onSort} />
              <SortTh label="Contact" k="contact" sort={sort} onSort={onSort} />
              <th className="th">Socials</th>
              <SortTh label="Tasks" k="tasks" sort={sort} onSort={onSort} />
              <th className="th">Deliverables</th>
              <SortTh label="Assigned to" k="assignee" sort={sort} onSort={onSort} />
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={7}>
                  No clients yet.
                </td>
              </tr>
            )}
            {rows.length > 0 && filtered.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-faint" colSpan={7}>
                  No clients match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="transition hover:bg-panel/60">
                <td className="td font-semibold text-ink">
                  <Link href={`${basePath}/clients/${r.id}`} className="hover:underline">
                    {r.name}
                  </Link>
                  {r.archived && (
                    <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line">
                      Archived
                    </span>
                  )}
                </td>
                <td className="td text-muted">{r.contact ?? "—"}</td>
                <td className="td">
                  <div className="flex gap-2 text-xs font-semibold">
                    {r.socials.length ? (
                      r.socials.map((s) => (
                        <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="link">
                          {s.label}
                        </a>
                      ))
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </div>
                </td>
                <td className="td">
                  <span className="font-bold text-ink">{r.taskTotal}</span>
                  {r.taskTotal > 0 && (
                    <span className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-muted">
                      {(["pending", "completed", "missed"] as const)
                        .filter((s) => r[s] > 0)
                        .map((s) => (
                          <span key={s} className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta[s].dot}`} />
                            {r[s]} {statusMeta[s].label}
                          </span>
                        ))}
                    </span>
                  )}
                </td>
                <td className="td">
                  {r.types.length ? (
                    <div className="flex max-w-44 flex-wrap gap-1">
                      {r.types.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand-line"
                        >
                          {t}
                        </span>
                      ))}
                      {r.types.length > 2 && (
                        <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line">
                          +{r.types.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="td">
                  <AssignSelect clientId={r.id} currentIds={r.assigneeIds} employees={employees} />
                </td>
                <td className="td text-right">
                  <Link
                    href={`${basePath}/clients/${r.id}`}
                    className="text-sm font-semibold text-muted transition hover:text-ink"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
