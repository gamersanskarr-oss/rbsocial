import Link from "next/link";
import { completedTasksBetween, listEmployees, missedTasksBetween } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import {
  BONUS_GRACE_MISSES,
  checkMissedDeadlines,
  MISSED_DEADLINE_LIMIT,
  PAYOUT_BONUS,
  PAYOUT_REDUCTION,
  payoutStatus,
} from "@/lib/deadlines";
import { setPerPostPay } from "@/app/actions/admin";
import { Card, PageHeader, TeamBadge } from "@/components/ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; employee?: string; team?: string }>;
}) {
  await requireAdmin();
  await checkMissedDeadlines();

  const { month, employee: employeeId, team } = await searchParams;
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? "");
  const now = new Date();
  const monthStart = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const monthLabel = monthStart.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const [employees, monthTasksAll, monthMissedAll] = await Promise.all([
    listEmployees(),
    completedTasksBetween(monthStart, monthEnd),
    missedTasksBetween(monthStart, monthEnd),
  ]);

  // Apply filters: specific employee wins over team filter
  const selectedEmployee = employees.find((e) => e.id === employeeId) ?? null;
  const teamFilter = team === "DESIGN" || team === "IT" ? team : null;
  const visibleEmployees = employees.filter((e) =>
    selectedEmployee ? e.id === selectedEmployee.id : teamFilter ? e.team === teamFilter : true
  );
  const visibleIds = new Set(visibleEmployees.map((e) => e.id));
  const monthTasks = monthTasksAll.filter((t) => visibleIds.has(t.assignedToId));

  const postsByUser = new Map<string, number>();
  const grossByUser = new Map<string, number>();
  const rateByUser = new Map(employees.map((e) => [e.id, e.perPostPay]));
  for (const t of monthTasks) {
    postsByUser.set(t.assignedToId, (postsByUser.get(t.assignedToId) ?? 0) + 1);
    const earned = t.payAmount ?? rateByUser.get(t.assignedToId) ?? 0;
    grossByUser.set(t.assignedToId, (grossByUser.get(t.assignedToId) ?? 0) + earned);
  }
  const missesByUser = new Map<string, number>();
  for (const t of monthMissedAll) {
    missesByUser.set(t.assignedToId, (missesByUser.get(t.assignedToId) ?? 0) + 1);
  }

  const rows = visibleEmployees.map((e) => {
    const posts = postsByUser.get(e.id) ?? 0;
    const misses = missesByUser.get(e.id) ?? 0;
    const rate = e.perPostPay;
    const gross = grossByUser.get(e.id) ?? 0;
    const reduced = payoutStatus(e.missedDeadlines).reduced;
    const deduction = reduced ? gross * PAYOUT_REDUCTION : 0;
    // On-time bonus: +10% of monthly earnings when misses ≤ grace limit
    // (and payout isn't already in reduction territory).
    const bonus = !reduced && misses <= BONUS_GRACE_MISSES ? gross * PAYOUT_BONUS : 0;
    return { employee: e, posts, misses, rate, gross, reduced, deduction, bonus, net: gross - deduction + bonus };
  });

  const totalPosts = monthTasks.length;
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalDeductions = rows.reduce((s, r) => s + r.deduction, 0);
  const totalBonus = rows.reduce((s, r) => s + r.bonus, 0);
  const totalNet = totalGross - totalDeductions + totalBonus;
  const missingRates = rows.filter((r) => r.posts > 0 && r.rate == null).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payouts"
        subtitle="Per-post rates, per-task earnings and month-end settlement."
      />

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Month</label>
            <input
              type="month"
              name="month"
              defaultValue={monthKey(monthStart)}
              className="input w-auto px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Employee</label>
            <select
              name="employee"
              defaultValue={selectedEmployee?.id ?? ""}
              className="input w-auto min-w-44 px-3 py-2 text-sm"
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Team</label>
            <select
              name="team"
              defaultValue={teamFilter ?? ""}
              className="input w-auto px-3 py-2 text-sm"
            >
              <option value="">All teams</option>
              <option value="DESIGN">Graphic Design</option>
              <option value="IT">IT Team</option>
            </select>
          </div>
          <button className="btn-primary px-4 py-2">Apply filters</button>
          <Link
            href="/admin/payouts"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            Reset
          </Link>
        </form>
      </div>

      {/* Month summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Posts completed" value={totalPosts} hint={monthLabel} />
        <Card title="Gross payout" value={inr(totalGross)} hint="Sum of per-task amounts" />
        <Card
          title="Deductions"
          value={inr(totalDeductions)}
          hint={`${PAYOUT_REDUCTION * 100}% if ${MISSED_DEADLINE_LIMIT}+ misses`}
        />
        <Card
          title="On-time bonus"
          value={inr(totalBonus)}
          hint={`+${PAYOUT_BONUS * 100}% if ≤${BONUS_GRACE_MISSES} miss`}
        />
        <Card title="Net payable" value={inr(totalNet)} hint={monthLabel} />
      </div>

      {missingRates > 0 && (
        <p className="banner-error">
          {missingRates} employee{missingRates === 1 ? "" : "s"} completed posts this month but
          {missingRates === 1 ? " has" : " have"} no per-post rate set — their earnings show as ₹0.
          Set rates below.
        </p>
      )}

      {/* Month-end settlement per employee */}
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Month-end settlement — {monthLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Employee</th>
                <th className="th">Team</th>
                <th className="th">Posts</th>
                <th className="th">Rate</th>
                <th className="th">Gross</th>
                <th className="th">Payout status</th>
                <th className="th">Deduction</th>
                <th className="th">Bonus</th>
                <th className="th">Net payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={9}>
                    No employees match these filters.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.employee.id} className="transition hover:bg-panel/60">
                  <td className="td font-semibold text-ink">{r.employee.name}</td>
                  <td className="td">
                    <TeamBadge team={r.employee.team} />
                  </td>
                  <td className="td font-medium text-ink">{r.posts}</td>
                  <td className="td text-muted">
                    {r.rate == null ? (
                      <span className="text-xs text-faint">not set</span>
                    ) : (
                      inr(r.rate)
                    )}
                  </td>
                  <td className="td font-medium text-ink">{inr(r.gross)}</td>
                  <td className="td">
                    {r.reduced ? (
                      <span className="inline-block rounded-full bg-bad-soft px-2.5 py-1 text-xs font-semibold text-bad ring-1 ring-inset ring-bad-line">
                        −{PAYOUT_REDUCTION * 100}% ({r.employee.missedDeadlines} misses)
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-faint">Full payout</span>
                    )}
                  </td>
                  <td className="td font-medium text-bad">
                    {r.deduction > 0 ? `−${inr(r.deduction)}` : "—"}
                  </td>
                  <td className="td font-medium text-ok">
                    {r.bonus > 0 ? `+${inr(r.bonus)}` : r.misses <= BONUS_GRACE_MISSES ? "—" : (
                      <span className="text-xs text-faint" title="Missed too many deadlines">lost</span>
                    )}
                  </td>
                  <td className="td font-bold text-ok">{inr(r.net)}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="border-t-2 border-line bg-panel/60">
                  <td className="td font-bold text-ink" colSpan={4}>
                    Total
                  </td>
                  <td className="td font-bold text-ink">{inr(totalGross)}</td>
                  <td className="td" />
                  <td className="td font-bold text-bad">
                    {totalDeductions > 0 ? `−${inr(totalDeductions)}` : "—"}
                  </td>
                  <td className="td font-bold text-ok">
                    {totalBonus > 0 ? `+${inr(totalBonus)}` : "—"}
                  </td>
                  <td className="td font-bold text-ok">{inr(totalNet)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-post rates */}
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Per-post pay rates</h2>
          <p className="mt-0.5 text-xs font-medium text-muted">
            Set what each employee earns per completed post. Applies to the payout tables above.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Employee</th>
                <th className="th">Team</th>
                <th className="th">Per-post pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {employees.map((e) => (
                <tr key={e.id} className="transition hover:bg-panel/60">
                  <td className="td font-semibold text-ink">{e.name}</td>
                  <td className="td">
                    <TeamBadge team={e.team} />
                  </td>
                  <td className="td">
                    <form action={setPerPostPay} className="flex items-center gap-1.5">
                      <input type="hidden" name="userId" value={e.id} />
                      <span className="text-xs font-semibold text-faint">₹</span>
                      <input
                        name="perPostPay"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={e.perPostPay ?? ""}
                        placeholder="—"
                        className="input w-24 px-2 py-1.5 text-sm"
                      />
                      <button
                        title="Save per-post pay"
                        className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
