import Link from "next/link";
import { listClientOptions, listEmployeeOptions, listTasksWithRefs, listTaskTypes } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader, StatusBadge } from "@/components/ui";
import CreateTaskForm from "./create-task-form";
import TaskTypesPanel from "./task-types-panel";

export default async function TasksView({ basePath }: { basePath: string }) {
  await checkMissedDeadlines();

  const [tasks, clients, employees, taskTypes] = await Promise.all([
    listTasksWithRefs(),
    listClientOptions(),
    listEmployeeOptions(),
    listTaskTypes(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tasks"
        subtitle="Assign new work and monitor progress across the whole team."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-bold text-ink">Assign a task</h2>
          <CreateTaskForm clients={clients} employees={employees} taskTypes={taskTypes} basePath={basePath} />
        </div>
        <TaskTypesPanel taskTypes={taskTypes} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Topic</th>
                <th className="th">Type</th>
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
                  <td className="td py-10 text-center text-faint" colSpan={8}>
                    No tasks yet — assign the first one above.
                  </td>
                </tr>
              )}
              {tasks.map((t) => {
                const overdue = t.status === "PENDING" && t.deadline < new Date();
                return (
                  <tr key={t.id} className="transition hover:bg-panel/60">
                    <td className="td max-w-56">
                      <Link
                        href={`${basePath}/tasks/${t.id}`}
                        className="block truncate font-semibold text-ink transition hover:text-brand"
                      >
                        {t.topic}
                      </Link>
                      <p className="truncate text-xs text-faint">{t.description}</p>
                    </td>
                    <td className="td">
                      {t.type ? (
                        <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand-line">
                          {t.type}{t.slideCount ? ` · ${t.slideCount} slides` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="td font-medium text-ink">{t.client.name}</td>
                    <td className="td text-muted">{t.assignedTo.name}</td>
                    <td className={`td ${overdue ? "font-bold text-bad" : "text-muted"}`}>
                      {t.deadline.toLocaleDateString()}{" "}
                      {t.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="td">
                      <StatusBadge status={t.status} />
                      {t.status === "COMPLETED" && t.approval === "PENDING" && (
                        <Link
                          href={`${basePath}/tasks/${t.id}`}
                          className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-bold text-info ring-1 ring-inset ring-info-line hover:bg-info-soft/60"
                          title="Submission waiting for your review"
                        >
                          👁 review
                        </Link>
                      )}
                      {t.payStatus === "PENDING" && (
                        <Link
                          href={`${basePath}/tasks/${t.id}`}
                          className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn ring-1 ring-inset ring-warn-line hover:bg-warn-soft/60"
                          title="Employee's quoted amount is waiting for approval"
                        >
                          ₹{t.payAmount} quote
                        </Link>
                      )}
                      {t.lateSubmission && (
                        <span
                          className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn ring-1 ring-inset ring-warn-line"
                          title="Submitted after the deadline"
                        >
                          late
                        </span>
                      )}
                      {t.missReason && (
                        <span
                          className="ml-1.5 inline-block cursor-help whitespace-nowrap rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold text-muted ring-1 ring-inset ring-line"
                          title={t.missReason}
                        >
                          💬 why
                        </span>
                      )}
                    </td>
                    <td className="td">
                      {t.requests.length > 0 ? (
                        <Link
                          href={`${basePath}/requests`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-line hover:bg-warn-soft/60"
                        >
                          {t.requests.length} open
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
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
                        <Link
                          href={`${basePath}/tasks/${t.id}`}
                          title="Edit task"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-hover hover:text-ink"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </Link>
                      </div>
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
