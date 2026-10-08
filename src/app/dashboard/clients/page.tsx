import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { assetCountsByClient, listClientsByAssignee, taskCountsByClient } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ClientLogo } from "@/components/client-logo";

export default async function MyClientsPage() {
  const user = await requireEmployee();

  const [clients, taskCounts, assetCounts] = await Promise.all([
    listClientsByAssignee(user.id),
    taskCountsByClient(),
    assetCountsByClient(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Clients"
        subtitle="The clients assigned to you, with their brand details and design assets."
      />

      {clients.length === 0 && (
        <div className="card p-10 text-center text-sm font-medium text-faint">
          No clients assigned to you yet. The admin assigns clients from their Clients page.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/clients/${c.id}`}
            className="card flex items-center gap-4 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <ClientLogo url={c.logoUrl} name={c.name} size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-ink">{c.name}</h2>
              <p className="mt-0.5 truncate text-xs font-medium text-muted">
                {c.phone ?? c.contact ?? "No contact yet"}
              </p>
              <p className="mt-1 text-xs font-semibold text-faint">
                {taskCounts.get(c.id) ?? 0} task{(taskCounts.get(c.id) ?? 0) === 1 ? "" : "s"} ·{" "}
                {assetCounts.get(c.id) ?? 0} asset{(assetCounts.get(c.id) ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
            <span className="text-faint">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
