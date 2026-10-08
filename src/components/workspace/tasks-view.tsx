import Link from "next/link";
import { listTasksWithRefs } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function TasksView({ basePath }: { basePath: string }) {
  await checkMissedDeadlines();

  const tasks = await listTasksWithRefs();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Tasks" subtitle="Monitor progress across the whole team." />
        <Link href={`${basePath}/assign`} className="btn-primary shrink-0">
          + Assign Task
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Topic</th>
                <th className="th">Client</th>
                <th className="th">Assigned to</th>
                <th className="th">Deadline</th>
                <th className="th">Status</th>
                <th className="th">Requests</th>
                <th className="th">Submission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tasks.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={7}>
                    No tasks yet — assign the first one above.
                  </td>
                </tr>
              )}
              {tasks.map((t) => {
                const overdue = t.status === "PENDING" && t.deadline < new Date();
                return (
                  <tr key={t.id} className="transition hover:bg-panel/60">
                    <td className="td max-w-56">
                      <p className="truncate font-semibold text-ink">{t.topic}</p>
                      <p className="truncate text-xs text-faint">{t.description}</p>
                    </td>
                    <td className="td font-medium text-ink">{t.client.name}</td>
                    <td className="td text-muted">{t.assignedTo.name}</td>
                    <td className={`td ${overdue ? "font-bold text-rose-600" : "text-muted"}`}>
                      {t.deadline.toLocaleDateString()}{" "}
                      {t.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="td"><StatusBadge status={t.status} /></td>
                    <td className="td">
                      {t.requests.length > 0 ? (
                        <Link
                          href={`${basePath}/requests`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/60 hover:bg-amber-100"
                        >
                          {t.requests.length} open
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="td">
                      {t.submissionLink ? (
                        <a
                          href={t.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          View design ↗
                        </a>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
