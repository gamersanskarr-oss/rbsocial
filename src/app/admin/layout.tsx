import { countOpenRequests } from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

const FINANCE_NAV = [
  { href: "/admin/finance", label: "Finance", icon: "finance" as const },
  { href: "/admin/payments", label: "Payments", icon: "payments" as const },
  { href: "/admin/expenses", label: "Expenses", icon: "expenses" as const },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "subscriptions" as const },
  { href: "/admin/dharam", label: "Dharam", icon: "dharam" as const },
  { href: "/admin/reports", label: "Reports", icon: "reports" as const },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminOrAccountant();

  if (user.role === "ACCOUNTANT") {
    return (
      <DashboardShell
        user={{ name: user.name, email: user.email, role: user.role }}
        nav={FINANCE_NAV}
      >
        {children}
      </DashboardShell>
    );
  }

  const openRequests = await countOpenRequests();
  const nav = [
    { href: "/admin", label: "Overview", icon: "overview" as const },
    ...FINANCE_NAV,
    { href: "/admin/calendar", label: "Calendar", icon: "calendar" as const },
    { href: "/admin/requests", label: "Requests", icon: "requests" as const, badge: openRequests },
    { href: "/admin/employees", label: "Employees", icon: "employees" as const },
    { href: "/admin/clients", label: "Clients", icon: "clients" as const },
    { href: "/admin/tasks", label: "Tasks", icon: "tasks" as const },
    { href: "/admin/assign", label: "Assign Task", icon: "assign" as const },
    { href: "/admin/payouts", label: "Payouts", icon: "payouts" as const },
  ];

  return (
    <DashboardShell user={{ name: user.name, email: user.email, role: user.role }} nav={nav}>
      {children}
    </DashboardShell>
  );
}
