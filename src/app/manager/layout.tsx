import { countOpenRequests, countPendingReviews } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();
  const [openRequests, pendingReviews] = await Promise.all([
    countOpenRequests(),
    countPendingReviews(),
  ]);

  const nav = [
    {
      label: "Workspace",
      items: [
        { href: "/manager/tasks", label: "Tasks", icon: "tasks" as const, badge: pendingReviews },
        { href: "/manager/clients", label: "Clients", icon: "clients" as const },
        { href: "/manager/calendar", label: "Calendar", icon: "calendar" as const },
        { href: "/manager/requests", label: "Requests", icon: "requests" as const, badge: openRequests },
      ],
    },
    {
      label: "More",
      items: [
        { href: "/manager/team", label: "My Team", icon: "employees" as const },
      ],
    },
  ];

  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: user.role }} nav={nav}>
      {children}
    </DashboardShell>
  );
}
