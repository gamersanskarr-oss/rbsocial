import Link from "next/link";
import { listClients, listDesigners, taskCountsByClient } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import AddClientForm from "./add-client-form";
import AssignSelect from "./assign-select";

export default async function ClientsPage() {
  await requireAdmin();
  const [designers, clients, taskCounts] = await Promise.all([
    listDesigners(),
    listClients(),
    taskCountsByClient(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Clients" subtitle="Assign each client to a graphic designer." />

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-bold text-ink">Add client</h2>
        <AddClientForm designers={designers} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Client</th>
                <th className="th">Retainer</th>
                <th className="th">Contact</th>
                <th className="th">Tasks</th>
                <th className="th">Assigned designer</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={6}>
                    No clients yet — add your first client above.
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="transition hover:bg-panel/60">
                  <td className="td font-semibold text-ink">
                    <Link href={`/admin/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                    {c.status === "ARCHIVED" && (
                      <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="td text-muted">
                    {c.monthlyFee ? `₹${c.monthlyFee.toLocaleString("en-IN")}/mo` : "—"}
                  </td>
                  <td className="td text-muted">{c.contact ?? "—"}</td>
                  <td className="td font-medium text-ink">{taskCounts.get(c.id) ?? 0}</td>
                  <td className="td">
                    <AssignSelect clientId={c.id} currentId={c.assignedToId} designers={designers} />
                  </td>
                  <td className="td text-right">
                    <Link href={`/admin/clients/${c.id}`} className="text-sm font-semibold text-muted transition hover:text-ink">
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
