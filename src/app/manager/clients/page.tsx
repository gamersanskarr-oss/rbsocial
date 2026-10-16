import Link from "next/link";
import { clientAssignees, listClients, taskCountsByClient, userNameMap } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function ManagerClientsPage() {
  await requireManager();
  const [clients, taskCounts, users] = await Promise.all([
    listClients(),
    taskCountsByClient(),
    userNameMap(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        subtitle="Every client's creative profile — who's working on what. Billing stays admin-only."
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Client</th>
                <th className="th">Contact</th>
                <th className="th">Socials</th>
                <th className="th">Tasks</th>
                <th className="th">Designer</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={6}>
                    No clients yet.
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="transition hover:bg-panel/60">
                  <td className="td font-semibold text-ink">
                    <Link href={`/manager/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                    {c.status === "ARCHIVED" && (
                      <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-line">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="td text-muted">{c.contact ?? c.phone ?? "—"}</td>
                  <td className="td">
                    <div className="flex gap-2 text-xs font-semibold">
                      {c.instagram && (
                        <a href={c.instagram} target="_blank" rel="noreferrer" className="link">
                          IG
                        </a>
                      )}
                      {c.facebook && (
                        <a href={c.facebook} target="_blank" rel="noreferrer" className="link">
                          FB
                        </a>
                      )}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="link">
                          Web
                        </a>
                      )}
                      {!c.instagram && !c.facebook && !c.website && (
                        <span className="text-faint">—</span>
                      )}
                    </div>
                  </td>
                  <td className="td font-medium text-ink">{taskCounts.get(c.id) ?? 0}</td>
                  <td className="td text-muted">
                    {clientAssignees(c).length
                      ? clientAssignees(c).map((uid) => users.get(uid) ?? "?").join(", ")
                      : "Unassigned"}
                  </td>
                  <td className="td text-right">
                    <Link
                      href={`/manager/clients/${c.id}`}
                      className="text-sm font-semibold text-muted transition hover:text-ink"
                    >
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
