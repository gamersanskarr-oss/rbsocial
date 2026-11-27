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
  const selected = monthly.find((m) => m.key === monthKey) ?? monthly[0];
  const monthRows = useMemo(
    () => rows.filter((r) => r.monthKey === selected?.key),
    [rows, selected],
  );
  const monthTotal = useMemo(() => monthRows.reduce((s, r) => s + r.pay, 0), [monthRows]);

  const downloadCsv = () => {
    if (!selected) return;
    const lines = [
      [csvCell("RB Social Branding — work report")],
      [csvCell("Employee"), csvCell(name)],
      [csvCell("Month"), csvCell(selected.label)],
      [""],
      ["Topic", "Deliverable", "Client", "Deadline", "Status", "Pay (₹)"].map(csvCell).join(","),
      ...monthRows.map((r) =>
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
      [["Total", "", "", "", "", csvCell(monthTotal)].join(",")],
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

  return (
    <div className="space-y-6">
      {/* Summary card */}
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
            {selected && (
              <div className="ml-auto border-l border-line pl-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  <select
                    value={selected.key}
                    onChange={(e) => setMonthKey(e.target.value)}
                    aria-label="Earnings month"
                    className="max-w-32 cursor-pointer truncate bg-transparent text-[10px] font-bold uppercase tracking-[0.14em] text-faint outline-none"
                  >
                    {monthly.map((m) => (
                      <option key={m.key} value={m.key} className="bg-elevated text-ink">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={downloadCsv}
                    title="Download this month's work as Excel (CSV)"
                    className="whitespace-nowrap rounded-lg border border-line bg-elevated px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm transition hover:bg-panel"
                  >
                    Excel ↓
                  </button>
                </div>
                <p className="text-lg font-bold text-ink">
                  ₹{selected.earned.toLocaleString("en-IN")}
                  {selected.bonus ? (
                    <span className="text-ok"> +₹{selected.bonus.toLocaleString("en-IN")} 🎁</span>
                  ) : null}
                </p>
              </div>
            )}
            <div className="border-l border-line pl-6 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Pending</p>
              <p className={`text-lg font-bold ${pendingAmount > 0 ? "text-warn" : "text-ink"}`}>
                ₹{pendingAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected month's work log */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel/70 px-5 py-3.5">
          <h2 className="text-sm font-bold text-ink">Work log — {selected?.label ?? ""}</h2>
          <span className="text-xs font-semibold text-muted">
            {monthRows.length} task{monthRows.length === 1 ? "" : "s"} · ₹{monthTotal.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
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
              {monthRows.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={6}>
                    No work logged in {selected?.label ?? "this month"}.
                  </td>
                </tr>
              )}
              {monthRows.map((r) => (
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
            {monthRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-panel/60">
                  <td className="td font-bold text-ink" colSpan={5}>
                    Total
                  </td>
                  <td className="td font-bold text-ok">₹{monthTotal.toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
