"use client";

import { useMemo, useState } from "react";
import { taskStatusText } from "@/components/ui";

export type EarningsRow = {
  topic: string;
  client: string;
  type: string | null;
  slideCount: number | null;
  deadlineISO: string;
  status: string;
  approval?: string | null;
  monthKey: string;
  pay: number;
};

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const isApprovedRow = (r: { status: string; approval?: string | null }) =>
  r.status === "COMPLETED" && (!r.approval || r.approval === "NONE" || r.approval === "APPROVED");

export default function EarningsPanel({
  name,
  totalEarned,
  pendingAmount,
  monthly,
  rows,
}: {
  name: string;
  totalEarned: number;
  pendingAmount: number;
  monthly: { key: string; label: string; earned: number; bonus: number }[];
  rows: EarningsRow[];
}) {
  // Defaults to the most recent month.
  const [monthKey, setMonthKey] = useState(monthly[0]?.key ?? "");
  const [fClient, setFClient] = useState("");
  const [fStatus, setFStatus] = useState("");
  const selected = monthly.find((m) => m.key === monthKey) ?? monthly[0];

  const clients = useMemo(
    () => [...new Set(rows.map((r) => r.client).filter(Boolean))].sort(),
    [rows],
  );

  // Month + client + status filters — the tiles, table and Excel all follow.
  const filtered = useMemo(() => {
    const monthRows = rows.filter((r) => r.monthKey === selected?.key);
    return monthRows.filter((r) => {
      if (fClient && r.client !== fClient) return false;
      if (fStatus === "APPROVED" && !isApprovedRow(r)) return false;
      if (fStatus === "REVIEW" && !(r.status === "COMPLETED" && r.approval === "PENDING")) return false;
      if (fStatus === "PENDING" && r.status !== "PENDING") return false;
      if (fStatus === "MISSED" && r.status !== "MISSED") return false;
      return true;
    });
  }, [rows, selected, fClient, fStatus]);

  const amounts = useMemo(() => {
    const approved = filtered.filter(isApprovedRow).reduce((s, r) => s + r.pay, 0);
    const pending = filtered
      .filter((r) => r.status === "COMPLETED" && r.approval === "PENDING")
      .reduce((s, r) => s + r.pay, 0);
    return { approved, pending, total: filtered.reduce((s, r) => s + r.pay, 0) };
  }, [filtered]);

  const filtering = Boolean(fClient || fStatus);

  const downloadCsv = () => {
    if (!selected) return;
    const lines = [
      [csvCell("RB Social Branding — work report")],
      [csvCell("Employee"), csvCell(name)],
      [csvCell("Month"), csvCell(selected.label)],
      [""],
      ["Topic", "Deliverable", "Client", "Deadline", "Status", "Pay (₹)"].map(csvCell).join(","),
      ...filtered.map((r) =>
        [
          csvCell(r.topic),
          csvCell(r.type ? `${r.type}${r.slideCount ? ` · ${r.slideCount} slides` : ""}` : ""),
          csvCell(r.client),
          csvCell(
            new Date(r.deadlineISO).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          ),
          csvCell(taskStatusText(r.status, r.approval)),
          csvCell(r.pay),
        ].join(","),
      ),
      [["Total", "", "", "", "", csvCell(amounts.total)].join(",")],
    ];
    const csv = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rb-work-${name.split(" ")[0].toLowerCase()}-${selected.label.replace(" ", "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectCls = "input w-auto min-w-32 px-3 py-1.5 text-xs font-semibold";

  return (
    <div className="space-y-6">
      {/* Summary card — all-time figures */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-elevated to-elevated p-[1px] shadow-lift">
        <div className="rounded-2xl bg-elevated/90 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-soft">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
                <path d="M5.5 12h.01" />
                <path d="M18.5 12h.01" />
              </svg>
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Earnings</p>
              <p className="text-2xl font-extrabold leading-tight tracking-tight text-ink">
                ₹{totalEarned.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="ml-auto border-l border-line pl-6 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Pending</p>
              <p className={`text-2xl font-extrabold leading-tight tracking-tight ${pendingAmount > 0 ? "text-warn" : "text-ink"}`}>
                ₹{pendingAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Work log — month + client + status filters */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <select
            value={selected?.key ?? ""}
            onChange={(e) => setMonthKey(e.target.value)}
            aria-label="Earnings month"
            className={selectCls}
          >
            {monthly.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <select value={fClient} onChange={(e) => setFClient(e.target.value)} className={selectCls}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
            <option value="">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="REVIEW">In review</option>
            <option value="PENDING">Pending</option>
            <option value="MISSED">Missed</option>
          </select>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setFClient("");
                setFStatus("");
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted transition hover:bg-hover hover:text-ink"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs font-medium text-faint">
            {filtered.length} of {rows.filter((r) => r.monthKey === selected?.key).length} tasks
          </span>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            title="Download the filtered work log as Excel (CSV)"
            className="whitespace-nowrap rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel disabled:opacity-50"
          >
            Excel ↓
          </button>
        </div>

        {/* Amount tiles — follow the filters */}
        <div className="grid grid-cols-3 gap-3 border-b border-line p-4">
          {[
            { label: "Approved amount", value: amounts.approved, dot: "bg-emerald-500" },
            { label: "Pending amount", value: amounts.pending, dot: "bg-sky-400" },
            { label: "Total amount", value: amounts.total, dot: "bg-faint" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-panel p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </p>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
                ₹{s.value.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Topic</th>
                <th className="th">Deliverable</th>
                <th className="th">Client</th>
                <th className="th">Deadline</th>
                <th className="th">Status</th>
                <th className="th">Pay (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={6}>
                    No work matches the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.topic + r.deadlineISO} className="transition hover:bg-panel/60">
                  <td className="td max-w-56 font-semibold text-ink">{r.topic}</td>
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
                  <td className="td text-muted">{r.client || "—"}</td>
                  <td className="td whitespace-nowrap text-muted">
                    {new Date(r.deadlineISO).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="td">
                    <span className="text-xs font-semibold text-muted">{taskStatusText(r.status, r.approval)}</span>
                  </td>
                  <td className="td whitespace-nowrap font-bold text-ink">₹{r.pay.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-panel/60">
                  <td className="td font-bold text-ink" colSpan={5}>
                    Total
                  </td>
                  <td className="td font-bold text-ok">₹{amounts.total.toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
