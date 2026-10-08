import Link from "next/link";
import {
  countOpenRequests,
  listClients,
  listEmployees,
  listTasksWithRefs,
} from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT } from "@/lib/deadlines";
import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

export default async function AdminOverview() {
  await requireAdmin();
  await checkMissedDeadlines();

  const [employees, clients, tasks, openRequests] = await Promise.all([
    listEmployees(),
    listClients(),
    listTasksWithRefs(),
    countOpenRequests(),
  ]);
  const recent = tasks.slice(0, 6);

  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const missed = tasks.filter((t) => t.status === "MISSED").length;
  const atRisk = employees.filter((e) => e.missedDeadlines >= MISSED_DEADLINE_LIMIT).length;

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" subtitle="A quick look at your team and workload." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Employees" value={employees.length} hint="Design + IT team" />
        <Card title="Clients" value={clients.length} />
        <Card title="Pending tasks" value={pending} />
        <Card title="Completed" value={completed} />
        <Card title="Missed deadlines" value={missed} hint={`${atRisk} at payout risk`} />
      </div>

      {openRequests > 0 && (
        <Link
          href="/admin/requests"
          className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/70 bg-amber-50 px-5 py-4 transition hover:bg-amber-100/70"
        >
          <p className="text-sm font-semibold text-amber-800">
            {openRequests} open request{openRequests === 1 ? "" : "s"} from your team — they need
            details to finish their tasks.
          </p>
          <span className="shrink-0 text-sm font-bold text-amber-800">View →</span>
        </Link>
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Recent tasks</h2>
          <Link href="/admin/tasks" className="link text-sm">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-faint">
              No tasks yet. Create one in Tasks.
            </li>
          )}
          {recent.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition hover:bg-panel/60"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{t.topic}</p>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  {t.client.name} → {t.assignedTo.name} · due {t.deadline.toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
