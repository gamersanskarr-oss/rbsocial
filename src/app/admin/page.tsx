import Link from "next/link";
import {
  completedTasksBetween,
  countOpenRequests,
  listClients,
  listEmployees,
  listExpenses,
  listPayments,
  listSubscriptions,
  listTasksWithRefs,
  missedTasksBetween,
} from "@/lib/data";
import {
  BONUS_GRACE_MISSES,
  checkMissedDeadlines,
  MISSED_DEADLINE_LIMIT,
  PAYOUT_BONUS,
  PAYOUT_REDUCTION,
  payoutStatus,
} from "@/lib/deadlines";
import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader, StatusBadge, TeamBadge } from "@/components/ui";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default async function AdminOverview() {
  await requireAdmin();
  await checkMissedDeadlines();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = monthStart.toLocaleDateString("en-IN", { month: "long" });

  const [
    employees,
    clients,
    tasks,
    openRequests,
    payments,
    expenses,
    subscriptions,
    monthDone,
    monthMissed,
  ] = await Promise.all([
    listEmployees(),
    listClients(),
    listTasksWithRefs(),
    countOpenRequests(),
    listPayments(),
    listExpenses(),
    listSubscriptions(),
    completedTasksBetween(monthStart, monthEnd),
    missedTasksBetween(monthStart, monthEnd),
  ]);

  const recent = tasks.slice(0, 6);

  // ---- Workload ----
  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const missed = tasks.filter((t) => t.status === "MISSED").length;
  const atRisk = employees.filter((e) => e.missedDeadlines >= MISSED_DEADLINE_LIMIT).length;

  // ---- Money this month ----
  const received = payments
    .filter((p) => p.receivedAt && p.receivedAt >= monthStart && p.receivedAt < monthEnd)
    .reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => !p.receivedAt);
  const outstanding = pendingPayments.reduce((s, p) => s + p.amount, 0);
  const overdueCount = pendingPayments.filter((p) => p.dueDate && p.dueDate < now).length;
  const monthExpenses = expenses
    .filter((e) => e.date >= monthStart && e.date < monthEnd)
    .reduce((s, e) => s + e.amount, 0);
  const netProfit = received - monthExpenses;
  const activeSubs = subscriptions.filter((s) => s.active).length;

  // ---- Payouts this month ----
  const rateByUser = new Map(employees.map((e) => [e.id, e.perPostPay]));
  const grossByUser = new Map<string, number>();
  const postsByUser = new Map<string, number>();
  for (const t of monthDone) {
    postsByUser.set(t.assignedToId, (postsByUser.get(t.assignedToId) ?? 0) + 1);
    grossByUser.set(
      t.assignedToId,
      (grossByUser.get(t.assignedToId) ?? 0) + (t.payAmount ?? rateByUser.get(t.assignedToId) ?? 0)
    );
  }
  const missesByUser = new Map<string, number>();
  for (const t of monthMissed) {
    missesByUser.set(t.assignedToId, (missesByUser.get(t.assignedToId) ?? 0) + 1);
  }
  let payoutNet = 0;
  for (const e of employees) {
    const gross = grossByUser.get(e.id) ?? 0;
    const reduced = payoutStatus(e.missedDeadlines).reduced;
    const deduction = reduced ? gross * PAYOUT_REDUCTION : 0;
    const bonus =
      !reduced && (missesByUser.get(e.id) ?? 0) <= BONUS_GRACE_MISSES ? gross * PAYOUT_BONUS : 0;
    payoutNet += gross - deduction + bonus;
  }

  // ---- Mini leaderboard: top 4 by posts this month ----
  const leaderboard = [...employees]
    .map((e) => ({ e, posts: postsByUser.get(e.id) ?? 0, gross: grossByUser.get(e.id) ?? 0 }))
    .sort((a, b) => b.posts - a.posts || b.gross - a.gross)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" subtitle="Everything at a glance — team, tasks and money." />

      {/* Workload */}
      <section>
        <h2 className="section-label mb-3">Workload</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card title="Employees" value={employees.length} hint="Design + IT team" />
          <Card title="Clients" value={clients.length} />
          <Card title="Pending tasks" value={pending} />
          <Card title="Completed" value={completed} hint="all time" />
          <Card title="Missed deadlines" value={missed} hint={`${atRisk} at payout risk`} />
        </div>
      </section>

      {/* Money */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-label">Money — {monthLabel}</h2>
          <Link href="/admin/payments" className="link text-xs">Payments →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card title="Received" value={inr(received)} hint={`${monthLabel} collections`} />
          <Card
            title="Outstanding"
            value={inr(outstanding)}
            hint={`${pendingPayments.length} unpaid · ${overdueCount} overdue`}
          />
          <Card title="Expenses" value={inr(monthExpenses)} hint={`${activeSubs} active subs`} />
          <Card
            title="Net profit"
            value={inr(netProfit)}
            hint={netProfit >= 0 ? "in the green" : "in the red"}
          />
          <Card
            title="Payouts due"
            value={inr(payoutNet)}
            hint={`${monthLabel} settlement`}
          />
        </div>
      </section>

      {openRequests > 0 && (
        <Link
          href="/admin/requests"
          className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/70 bg-warn-soft px-5 py-4 transition hover:bg-warn-soft/60"
        >
          <p className="text-sm font-semibold text-warn">
            {openRequests} open request{openRequests === 1 ? "" : "s"} from your team — they need
            details to finish their tasks.
          </p>
          <span className="shrink-0 text-sm font-bold text-warn">View →</span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Top performers — {monthLabel}</h2>
            <Link href="/admin/employees" className="link text-sm">All users</Link>
          </div>
          <ul className="divide-y divide-line">
            {leaderboard.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-faint">No employees yet.</li>
            )}
            {leaderboard.map(({ e, posts, gross }, i) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-5 text-sm font-bold text-faint">
                  {["🥇", "🥈", "🥉", "4."][i]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{e.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-faint">
                    <TeamBadge team={e.team} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{posts} posts</p>
                  <p className="text-xs font-medium text-ok">{inr(gross)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <p className="text-xs font-medium text-faint">
              Misses this month:{" "}
              {monthMissed.length === 0 ? "none — clean board 🎯" : `${monthMissed.length}`}
            </p>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Recent tasks</h2>
            <Link href="/admin/tasks" className="link text-sm">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-faint">
                No tasks yet. Create one in Tasks.
              </li>
            )}
            {recent.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition hover:bg-panel/60"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {t.topic}
                    {t.type && (
                      <span className="ml-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand ring-1 ring-inset ring-brand-line">
                        {t.type}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {t.client.name} → {t.assignedTo.name} · due {t.deadline.toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
