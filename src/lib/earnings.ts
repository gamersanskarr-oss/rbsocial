import "server-only";
import { taskPay, type TaskWithRefs } from "./data";
import { BONUS_GRACE_MISSES, PAYOUT_BONUS, payoutStatus } from "./deadlines";

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

export type EarningsSummary = {
  /** Approved work only — submitted-but-unreviewed money sits in pendingAmount. */
  totalEarned: number;
  pendingAmount: number;
  /** Approved earnings per month (most recent first) with the on-time bonus. */
  monthly: { key: string; label: string; earned: number; bonus: number }[];
  /** One row per task for the month view + Excel download. Finished work
      belongs to its completion month; open/missed work to its deadline. */
  rows: EarningsRow[];
};

export function computeEarnings(
  tasks: TaskWithRefs[],
  rate: number | null,
  missedDeadlines: number,
): EarningsSummary {
  const pay = (t: TaskWithRefs) => taskPay(t, rate ?? 0);
  // Price approval is ADMIN-only (payStatus) — a manager approving the task
  // does not approve the money. Base-rate work (no quote involved) needs no
  // approval.
  const isApproved = (t: { payStatus?: string | null }) =>
    !t.payStatus || t.payStatus === "NONE" || t.payStatus === "APPROVED";
  const done = tasks.filter((t) => t.status === "COMPLETED" && isApproved(t));
  const pendingAmount = tasks
    .filter((t) => t.status === "COMPLETED" && t.payStatus === "PENDING")
    .reduce((s, t) => s + pay(t), 0);
  const totalEarned = done.reduce((s, t) => s + pay(t), 0);

  const missesByMonth = new Map<string, number>();
  for (const t of tasks) {
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
        !payoutStatus(missedDeadlines).reduced && misses <= BONUS_GRACE_MISSES
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

  const rows: EarningsRow[] = tasks.map((t) => {
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

  return { totalEarned, pendingAmount, monthly, rows };
}
