import Link from "next/link";
import { listEmployees, listTasksWithRefs } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader, TeamBadge } from "@/components/ui";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireManager();
  await checkMissedDeadlines();

  const { month } = await searchParams;
  const selected = /^\d{4}-\d{2}$/.test(month ?? "") ? month! : monthKey(new Date());

  const [employees, tasks] = await Promise.all([listEmployees(), listTasksWithRefs()]);

  const [selY, selM] = selected.split("-").map(Number);
  const inMonth = (d: Date | null) =>
    d != null && d.getFullYear() === selY && d.getMonth() === selM - 1;

  const rows = employees.map((e) => {
    const mine = tasks.filter((t) => t.assignedToId === e.id);
    const completed = mine.filter((t) => t.status === "COMPLETED" && inMonth(t.completedAt));
    const missed = mine.filter((t) => t.status === "MISSED" && inMonth(t.deadline));
    const open = mine.filter((t) => t.status === "PENDING");
    const dueThisMonth = mine.filter((t) => inMonth(t.deadline));
    const rate =
      dueThisMonth.length > 0
        ? Math.round((completed.length / Math.max(1, dueThisMonth.filter((t) => t.status !== "PENDING").length || dueThisMonth.length)) * 100)
        : null;
    return { e, completed: completed.length, missed: missed.length, open: open.length, due: dueThisMonth.length, rate };
  });

  const monthLabel = new Date(selY, selM - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team reports"
        subtitle={`Work delivered per employee — ${monthLabel}.`}
      />

      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Month</label>
            <input
              type="month"
              name="month"
              defaultValue={selected}
              className="input w-auto px-3 py-2 text-sm"
            />
          </div>
          <button className="btn-primary px-4 py-2">View</button>
          <Link
            href="/manager/reports"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            This month
          </Link>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Employee</th>
                <th className="th">Team</th>
                <th className="th">Due this month</th>
                <th className="th">Completed</th>
                <th className="th">Missed</th>
                <th className="th">Open now</th>
                <th className="th">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={7}>
                    No employees yet.
                  </td>
                </tr>
              )}
              {rows.map(({ e, completed, missed, open, due, rate }) => (
                <tr key={e.id} className="transition hover:bg-panel/60">
                  <td className="td font-semibold text-ink">{e.name}</td>
                  <td className="td"><TeamBadge team={e.team} /></td>
                  <td className="td font-medium text-ink">{due}</td>
                  <td className="td font-semibold text-ok">{completed}</td>
                  <td className={`td font-semibold ${missed > 0 ? "text-bad" : "text-muted"}`}>{missed}</td>
                  <td className="td font-medium text-muted">{open}</td>
                  <td className="td">
                    {rate === null ? (
                      <span className="text-xs text-faint">—</span>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                          rate >= 80
                            ? "bg-ok-soft text-ok ring-ok-line"
                            : rate >= 50
                              ? "bg-warn-soft text-warn ring-warn-line"
                              : "bg-bad-soft text-bad ring-bad-line"
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs font-medium text-faint">
        Completion % = tasks completed in {monthLabel} ÷ tasks due that month (excludes
        still-open work). Pay and finance numbers stay admin-only.
      </p>
    </div>
  );
}
