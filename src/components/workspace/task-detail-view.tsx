import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskDetail, getUser } from "@/lib/data";
import { StatusBadge, TeamBadge } from "@/components/ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function TaskDetailView({
  id,
  basePath,
}: {
  id: string;
  basePath: string;
}) {
  const task = await getTaskDetail(id);
  if (!task) notFound();
  const assignee = await getUser(task.assignedToId);

  const isAdmin = basePath === "/admin";
  const overdue = task.status === "PENDING" && task.deadline < new Date();

  return (
    <div className="space-y-6">
      <Link
        href={`${basePath}/tasks`}
        className="inline-block text-sm font-semibold text-muted transition hover:text-ink"
      >
        ← Back to tasks
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {task.topic}
              {task.type && (
                <span className="ml-2 align-middle rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand ring-1 ring-inset ring-brand-line">
                  {task.type}{task.slideCount ? ` · ${task.slideCount} slides` : ""}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted">
              {isAdmin ? (
                <Link href={`/admin/clients/${task.client.id}`} className="link">
                  {task.client.name}
                </Link>
              ) : (
                task.client.name
              )}
              {" · "}
              due {task.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
              {task.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {overdue && <span className="font-bold text-bad"> — overdue</span>}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Brief */}
          <div className="card p-6">
            <h2 className="section-label mb-3">Brief</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
              {task.description}
            </p>
          </div>

          {/* Submission */}
          <div className="card p-6">
            <h2 className="section-label mb-3">Submission</h2>
            {task.submissionLink ? (
              <>
                <p className="text-sm font-medium text-muted">
                  Submitted{" "}
                  {task.completedAt?.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {task.completedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <a
                  href={task.submissionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="link mt-2 inline-block break-all text-sm"
                >
                  {task.submissionLink} ↗
                </a>
              </>
            ) : (
              <p className="text-sm font-medium text-faint">
                {task.status === "MISSED"
                  ? "Never submitted — deadline passed."
                  : "Not submitted yet."}
              </p>
            )}
          </div>

          {/* Requests on this task */}
          <div className="card p-6">
            <h2 className="section-label mb-3">Requests from the assignee</h2>
            <ul className="space-y-2">
              {task.requests.length === 0 && (
                <li className="rounded-xl bg-panel/60 px-4 py-3 text-sm font-medium text-faint">
                  No requests on this task.
                </li>
              )}
              {task.requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line bg-panel/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{r.message}</p>
                    <p className="mt-0.5 text-xs font-medium text-faint">
                      {r.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      r.status === "RESOLVED"
                        ? "bg-ok-soft text-ok ring-ok-line"
                        : "bg-warn-soft text-warn ring-warn-line"
                    }`}
                  >
                    {r.status === "RESOLVED" ? "Resolved" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Assignee</p>
            <p className="mt-2 text-sm font-bold text-ink">{assignee?.name ?? "—"}</p>
            {assignee?.team != null && (
              <div className="mt-1.5"><TeamBadge team={assignee.team} /></div>
            )}
          </div>

          {isAdmin && task.payAmount != null && (
            <div className="card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Task pay
              </p>
              <p className="mt-2 text-lg font-extrabold text-ink">{inr(task.payAmount)}</p>
            </div>
          )}

          {(task.referenceLink || task.submissionLink) && (
            <div className="card p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">Links</p>
              <div className="space-y-2">
                {task.referenceLink && (
                  <a
                    href={task.referenceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-hover"
                  >
                    Reference / brief
                    <span className="text-faint">↗</span>
                  </a>
                )}
                {task.submissionLink && (
                  <a
                    href={task.submissionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-hover"
                  >
                    Submitted design
                    <span className="text-faint">↗</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
