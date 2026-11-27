import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { DashboardShell } from "@/components/dashboard-shell";

// Auth-gated workspace — never prerender-probe at build time (the probe would
// otherwise run Firestore queries against a possibly-slow connection).
export const dynamic = "force-dynamic";

const buildNav = (openTasks: number) => [
  {
    label: "My work",
    items: [
      { href: "/dashboard", label: "Overview", icon: "overview" as const },
      {
        href: "/dashboard/tasks",
        label: "My Tasks",
        icon: "my-tasks" as const,
        badge: openTasks,
      },
      { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" as const },
      { href: "/dashboard/clients", label: "My Clients", icon: "clients" as const },
      { href: "/dashboard/earnings", label: "Earnings", icon: "payouts" as const },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployee();
  // Flip overdue tasks + bump strikes BEFORE reading tasks, so the nav badge
  // never sees stale numbers.
  await checkMissedDeadlines();

  const myTasks = await listTasksForUser(user.id);
  const nav = buildNav(myTasks.filter((t) => t.status !== "COMPLETED").length);

  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: user.role }} nav={nav}>
      {children}
    </DashboardShell>
  );
}
