import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth";
import { getClient, listAssets, tasksByClient } from "@/lib/data";
import { StatusBadge } from "@/components/ui";
import { ClientLogo } from "@/components/client-logo";

export default async function MyClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployee();
  const { id } = await params;

  const [client, assets, clientTasks] = await Promise.all([
    getClient(id),
    listAssets(id),
    tasksByClient(id),
  ]);
  if (!client || client.assignedToId !== user.id) notFound();
  const tasks = clientTasks.filter((t) => t.assignedToId === user.id);

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
        </div>
        {socials.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
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
          <h2 className="mb-3 text-sm font-bold text-ink">My tasks for this client</h2>
          <ul className="divide-y divide-line">
            {tasks.length === 0 && (
              <li className="py-3 text-sm font-medium text-faint">No tasks for this client yet.</li>
            )}
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/dashboard/tasks/${t.id}`} className="text-sm font-semibold text-ink hover:underline">
                  {t.topic}
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
