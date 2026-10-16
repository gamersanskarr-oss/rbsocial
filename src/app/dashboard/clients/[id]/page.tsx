import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth";
import { clientAssignees, getClient, listAssets, tasksByClient } from "@/lib/data";
import { StatusBadge } from "@/components/ui";
import { ClientLogo } from "@/components/client-logo";

export default async function MyClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireEmployee();
  const { id } = await params;
  const { status } = await searchParams;

  const [client, assets, clientTasks] = await Promise.all([
    getClient(id),
    listAssets(id),
    tasksByClient(id),
  ]);
  if (!client || !clientAssignees(client).includes(user.id)) notFound();
  const tasks = clientTasks.filter((t) => t.assignedToId === user.id);

  const statusFilter = ["PENDING", "COMPLETED", "MISSED"].includes(status ?? "")
    ? status!
    : "";
  const shown = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;

  const socials = [
    { label: "Instagram", url: client.instagram },
    { label: "Facebook", url: client.facebook },
    { label: "Website", url: client.website },
  ].filter((s) => s.url);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/clients" className="inline-block text-sm font-semibold text-muted transition hover:text-ink">
        ← My clients
      </Link>

      <div className="card flex flex-wrap items-center gap-5 p-6">
        <ClientLogo url={client.logoUrl} name={client.name} size={72} rounded="rounded-2xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{client.name}</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            {client.contact ?? "No contact yet"}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
          {client.requirements && client.requirements.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {client.requirements.map((r, i) => (
                <span
                  key={i}
                  className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand-line"
                >
                  {r.qty}× {r.type}/{r.per === "WEEK" ? "wk" : "mo"}
                </span>
              ))}
            </div>
          )}
        </div>
        {socials.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-line bg-elevated px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {client.notes && (
            <div className="card p-6">
              <h2 className="mb-3 text-sm font-bold text-ink">Brand notes</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{client.notes}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="mb-1 text-sm font-bold text-ink">Design elements &amp; assets</h2>
            <p className="mb-4 text-sm font-medium text-muted">
              Shared by the admin — use these while designing for {client.name}.
            </p>
            <ul className="space-y-2">
              {assets.length === 0 && (
                <li className="rounded-xl bg-panel/60 px-4 py-3 text-sm font-medium text-faint">
                  No assets uploaded yet. Request what you need from a task page.
                </li>
              )}
              {assets.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/50 px-4 py-3 transition hover:bg-hover"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{a.name}</span>
                      <span className="block truncate text-xs font-medium text-faint">{a.url}</span>
                    </span>
                    <span className="text-faint">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">My tasks for this client</h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { v: "", label: "All", n: tasks.length },
                { v: "PENDING", label: "Pending", n: tasks.filter((t) => t.status === "PENDING").length },
                { v: "COMPLETED", label: "Completed", n: tasks.filter((t) => t.status === "COMPLETED").length },
                { v: "MISSED", label: "Missed", n: tasks.filter((t) => t.status === "MISSED").length },
              ].map((f) => (
                <Link
                  key={f.v}
                  href={f.v ? `/dashboard/clients/${id}?status=${f.v}` : `/dashboard/clients/${id}`}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset transition ${
                    statusFilter === f.v
                      ? "bg-ink text-canvas ring-ink"
                      : "bg-panel text-muted ring-line hover:text-ink"
                  }`}
                >
                  {f.label} {f.n}
                </Link>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-line">
            {shown.length === 0 && (
              <li className="py-3 text-sm font-medium text-faint">
                {statusFilter ? "No tasks match this filter." : "No tasks for this client yet."}
              </li>
            )}
            {shown.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/dashboard/tasks/${t.id}`} className="text-sm font-semibold text-ink hover:underline">
                  {t.topic}
                  {t.type && (
                    <span className="ml-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand ring-1 ring-inset ring-brand-line">
                      {t.type}
                    </span>
                  )}
                </Link>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
