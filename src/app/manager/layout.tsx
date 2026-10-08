import { countOpenRequests } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();
  const openRequests = await countOpenRequests();

  const nav = [
    { href: "/manager/tasks", label: "Tasks", icon: "tasks" as const },
    { href: "/manager/calendar", label: "Calendar", icon: "calendar" as const },
    { href: "/manager/requests", label: "Requests", icon: "requests" as const, badge: openRequests },
    { href: "/manager/assign", label: "Assign Task", icon: "assign" as const },
  ];

  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: user.role }} nav={nav}>
      {children}
    </DashboardShell>
  );
}
