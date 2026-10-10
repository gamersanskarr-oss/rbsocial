import { requireEmployee } from "@/lib/auth";
import { countCompletedTasks, getUser } from "@/lib/data";
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

  const [fresh, completedCount] = await Promise.all([
    getUser(user.id),
    countCompletedTasks(user.id),
  ]);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
      nav={nav}
      payBox={
        fresh?.team === "DESIGN"
          ? { perPostPay: fresh.perPostPay ?? null, completedCount }
          : undefined
      }
    >
      {children}
    </DashboardShell>
  );
}
