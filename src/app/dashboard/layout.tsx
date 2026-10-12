import { requireEmployee } from "@/lib/auth";
import { getUser, listTasksForUser } from "@/lib/data";
import { BONUS_GRACE_MISSES, PAYOUT_BONUS, payoutStatus } from "@/lib/deadlines";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  {
    label: "My work",
    items: [
      { href: "/dashboard", label: "My Tasks", icon: "my-tasks" as const },
      { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" as const },
      { href: "/dashboard/clients", label: "My Clients", icon: "clients" as const },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployee();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const [fresh, myTasks] = await Promise.all([getUser(user.id), listTasksForUser(user.id)]);

  const rate = fresh?.perPostPay ?? null;
  const done = myTasks.filter((t) => t.status === "COMPLETED");
  const earned = (t: (typeof done)[number]) => t.payAmount ?? rate ?? 0;

  const totalEarned = done.reduce((s, t) => s + earned(t), 0);
  const monthEarned = done
    .filter((t) => t.completedAt && t.completedAt >= monthStart && t.completedAt < monthEnd)
    .reduce((s, t) => s + earned(t), 0);
  const monthMisses = myTasks.filter(
    (t) => t.status === "MISSED" && t.deadline >= monthStart && t.deadline < monthEnd
  ).length;
  const monthBonus =
    monthMisses <= BONUS_GRACE_MISSES && !payoutStatus(fresh?.missedDeadlines ?? 0).reduced
      ? monthEarned * PAYOUT_BONUS
      : 0;

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
      nav={nav}
      payBox={{
        perPostPay: rate,
        completedCount: done.length,
        totalEarned,
        monthEarned,
        monthBonus,
      }}
    >
      {children}
    </DashboardShell>
  );
}
