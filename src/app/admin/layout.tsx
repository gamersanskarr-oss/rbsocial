import {
  countDuePayments,
  countNewApplications,
  countOpenRequests,
  countPendingQuotes,
  countPendingReviews,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminOrAccountant();

  const [openRequests, pendingReviews, pendingQuotes, newApps, duePayments] =
    await Promise.all([
      countOpenRequests(),
      countPendingReviews(),
      countPendingQuotes(),
      countNewApplications(),
      countDuePayments(),
    ]);

  const financeNav = [
    { href: "/admin/payments", label: "Payments", icon: "payments" as const, badge: duePayments },
    { href: "/admin/expenses", label: "Expenses", icon: "expenses" as const },
    { href: "/admin/dharam", label: "Dharam", icon: "dharam" as const },
  ];

  if (user.role === "ACCOUNTANT") {
    return (
      <DashboardShell
        user={{ name: user.name, email: user.email, role: user.role }}
        nav={[{ label: "Finance", items: financeNav }]}
      >
        {children}
      </DashboardShell>
    );
  }

  const nav = [
    { items: [{ href: "/admin", label: "Overview", icon: "overview" as const }] },
    { label: "Finance", items: financeNav },
    {
      label: "Work",
      items: [
        { href: "/admin/calendar", label: "Calendar", icon: "calendar" as const },
        { href: "/admin/requests", label: "Requests", icon: "requests" as const, badge: openRequests },
        { href: "/admin/tasks", label: "Tasks", icon: "tasks" as const, badge: pendingReviews },
      ],
    },
    {
      label: "Manage",
      items: [
        { href: "/admin/employees", label: "Users", icon: "employees" as const },
        { href: "/admin/clients", label: "Clients", icon: "clients" as const },
        { href: "/admin/payouts", label: "Payouts", icon: "payouts" as const, badge: pendingQuotes },
        { href: "/admin/jobs", label: "Jobs", icon: "jobs" as const, badge: newApps },
      ],
    },
  ];

  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: user.role }} nav={nav}>
      {children}
    </DashboardShell>
  );
}
