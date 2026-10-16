import Link from "next/link";
import { notFound } from "next/navigation";
import { clientAssignees, getClient, tasksByClient, userNameMap } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function ManagerClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireManager();
  const { id } = await params;
  const [client, tasks, users] = await Promise.all([
    getClient(id),
    tasksByClient(id),
    userNameMap(),
  ]);
  if (!client) notFound();

  const open = tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div className="space-y-8">
      <Link
        href="/manager/clients"
        className="inline-block text-sm font-semibold text-muted transition hover:text-ink"
      >
        ← Back to clients
      </Link>

      <PageHeader
        title={client.name}
        subtitle={`${tasks.length} tasks · ${open.length} open${client.status === "ARCHIVED" ? " · Archived" : ""}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Creative profile — no billing info */}
        <div className="card space-y-4 self-start p-6">
          <h2 className="text-sm font-bold text-ink">Profile</h2>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">Designer</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {clientAssignees(client).length
                ? clientAssignees(client).map((uid) => users.get(uid) ?? "?").join(", ")
                : "Unassigned"}
            </p>
          </div>
          {client.requirements && client.requirements.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                Content requirements
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {client.requirements.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand-line"
                  >
                    {r.qty}× {r.type}/{r.per === "WEEK" ? "wk" : "mo"}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(client.contact || client.phone) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Contact</p>
              <p className="mt-1 text-sm font-medium text-ink">{client.contact ?? client.phone}</p>
            </div>
          )}
          {(client.instagram || client.facebook || client.website) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Socials</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {client.instagram && (
                  <a href={client.instagram} target="_blank" rel="noreferrer" className="link text-sm">
                    Instagram ↗
                  </a>
                )}
                {client.facebook && (
                  <a href={client.facebook} target="_blank" rel="noreferrer" className="link text-sm">
                    Facebook ↗
                  </a>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noreferrer" className="link text-sm">
                    Website ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {client.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm font-medium text-muted">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* All creative work for this client */}
        <div className="card self-start overflow-hidden lg:col-span-2">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Tasks ({tasks.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr>
                  <th className="th">Task</th>
                  <th className="th">Type</th>
                  <th className="th">Assigned to</th>
                  <th className="th">Deadline</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tasks.length === 0 && (
                  <tr>
                    <td className="td py-10 text-center text-faint" colSpan={5}>
                      No tasks for this client yet.
                    </td>
                  </tr>
                )}
                {tasks.map((t) => (
                  <tr key={t.id} className="transition hover:bg-panel/60">
                    <td className="td max-w-52">
                      <Link href={`/manager/tasks/${t.id}`} className="link font-semibold">
                        <p className="truncate">{t.topic}</p>
                      </Link>
                    </td>
                    <td className="td">
                      {t.type ? (
                        <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand-line">
                          {t.type}{t.slideCount ? ` · ${t.slideCount}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="td text-muted">{t.assignedTo.name || "—"}</td>
                    <td className="td whitespace-nowrap text-muted">
                      {t.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="td"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
