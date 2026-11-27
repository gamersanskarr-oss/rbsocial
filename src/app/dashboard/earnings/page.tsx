import { requireEmployee } from "@/lib/auth";
import { getUser, listTasksForUser, taskPay } from "@/lib/data";
import { BONUS_GRACE_MISSES, PAYOUT_BONUS, payoutStatus } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";
import EarningsPanel, { type EarningsRow } from "../earnings-panel";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const user = await requireEmployee();
  const [fresh, myTasks] = await Promise.all([getUser(user.id), listTasksForUser(user.id)]);

  const rate = fresh?.perPostPay ?? null;
  const pay = (t: (typeof myTasks)[number]) => taskPay(t, rate ?? 0);
  // "Earnings" counts APPROVED work only — submitted-but-unreviewed money is
  // shown separately as "Pending" until the manager decides.
  const isApproved = (t: { approval?: string | null }) =>
    !t.approval || t.approval === "NONE" || t.approval === "APPROVED";
  const done = myTasks.filter((t) => t.status === "COMPLETED" && isApproved(t));
  const pendingAmount = myTasks
    .filter((t) => t.status === "COMPLETED" && t.approval === "PENDING")
    .reduce((s, t) => s + pay(t), 0);

  const totalEarned = done.reduce((s, t) => s + pay(t), 0);

  // Monthly breakdown: approved earnings grouped by completion month, with
  // that month's on-time bonus.
  const missesByMonth = new Map<string, number>();
  for (const t of myTasks) {
    if (t.status !== "MISSED") continue;
    const key = `${t.deadline.getFullYear()}-${t.deadline.getMonth()}`;
    missesByMonth.set(key, (missesByMonth.get(key) ?? 0) + 1);
  }
  const earnedByMonth = new Map<string, number>();
  for (const t of done) {
    if (!t.completedAt) continue;
    const key = `${t.completedAt.getFullYear()}-${t.completedAt.getMonth()}`;
    earnedByMonth.set(key, (earnedByMonth.get(key) ?? 0) + pay(t));
  }
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
  if (!earnedByMonth.has(currentKey)) earnedByMonth.set(currentKey, 0);

  const monthly = [...earnedByMonth.entries()]
    .map(([key, earned]) => {
      const [y, m] = key.split("-").map(Number);
      const misses = missesByMonth.get(key) ?? 0;
      const bonus =
        !payoutStatus(fresh?.missedDeadlines ?? 0).reduced && misses <= BONUS_GRACE_MISSES
          ? earned * PAYOUT_BONUS
          : 0;
      return {
        key,
        label: new Date(y, m, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        earned,
        bonus,
      };
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1));

  // One row per task for the month view + Excel download. Finished work
  // belongs to its completion month; open/missed work to its deadline.
  const rows: EarningsRow[] = myTasks.map((t) => {
    const ref = t.completedAt ?? t.deadline;
    return {
      topic: t.topic,
      client: t.client.name,
      type: t.type,
      slideCount: t.slideCount,
      deadlineISO: t.deadline.toISOString(),
      status: t.status,
      approval: t.approval,
      monthKey: `${ref.getFullYear()}-${ref.getMonth()}`,
      pay: pay(t),
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings"
        subtitle="Approved earnings, pending approvals and your month-wise work log."
      />
      <EarningsPanel
        name={user.name}
        totalEarned={totalEarned}
        pendingAmount={pendingAmount}
        monthly={monthly}
        rows={rows}
      />
    </div>
  );
}
