import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTaskDetail,
  getUser,
  listClientOptions,
  listEmployeeOptions,
  listTaskTypes,
  safeHref,
} from "@/lib/data";
import { StatusBadge, TeamBadge } from "@/components/ui";
import { reviewTaskPay } from "@/app/actions/admin";
import { ToastForm } from "@/components/toast";
import EditTaskForm from "./edit-task-form";
import ReviewTaskForm from "./review-task-form";

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
  const [assignee, clients, employees, taskTypes] = await Promise.all([
    getUser(task.assignedToId),
    listClientOptions(),
    listEmployeeOptions(),
    listTaskTypes(),
  ]);

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
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            {task.lateSubmission && (
              <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn ring-1 ring-inset ring-warn-line">
                Late submission
              </span>
            )}
          </div>
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
                  href={safeHref(task.submissionLink)}
                  target="_blank"
                  rel="noreferrer"
                  className="link mt-2 inline-block break-all text-sm"
                >
                  {task.submissionLink} ↗
                </a>
                {/* Pending price quote — approve or decline right here */}
                {task.payStatus === "PENDING" && (
                  <div className="mt-3 rounded-2xl border border-warn-line bg-warn-soft/60 p-4">
                    <p className="text-sm font-bold text-warn">
                      💰 ₹{(task.payAmount ?? 0).toLocaleString("en-IN")} quoted by{" "}
                      {assignee?.name ?? "the employee"} — approve or decline the amount
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ToastForm action={reviewTaskPay} success="Quote approved." className="flex items-center gap-2">
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="mode" value="approve" />
                        <input
                          name="amount"
                          type="number"
                          min="0"
                          step="1"
                          required
                          defaultValue={task.payAmount ?? 0}
                          className="input w-28 px-2.5 py-1.5 text-xs"
                          aria-label="Approved amount"
                        />
                        <button className="btn-primary py-1.5 text-xs">Approve ₹ ✓</button>
                      </ToastForm>
                      <ToastForm action={reviewTaskPay} success="Quote declined — base rate applies.">
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="mode" value="decline" />
                        <button className="rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-panel hover:text-ink">
                          Decline — pay at base rate
                        </button>
                      </ToastForm>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-muted">
                      Until approved, this task counts at the employee&apos;s base per-post rate.
                    </p>
                  </div>
                )}

                {task.approval === "APPROVED" ? (
                  <p className="mt-3 rounded-xl bg-ok-soft px-3.5 py-2.5 text-sm font-bold text-ok">
                    ✓ Approved{task.reviewNote ? ` — “${task.reviewNote}”` : ""}
                  </p>
                ) : task.status === "COMPLETED" ? (
                  <ReviewTaskForm taskId={task.id} />
                ) : (
                  <p
                    className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                      task.approval === "REJECTED"
                        ? "bg-bad-soft text-bad"
                        : "bg-warn-soft text-warn"
                    }`}
                  >
                    {task.approval === "REJECTED" ? "✗ Rejected" : "✏️ Sent back for changes"}
                    {task.reviewNote ? ` — “${task.reviewNote}”` : ""} — awaiting resubmission.
                  </p>
                )}
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
          {/* Edit task */}
          <details className="card group/edit p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
              <h2 className="section-label">Edit task</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted transition group-open/edit:rotate-45">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Edit
              </span>
            </summary>
            <div className="mt-5 border-t border-line pt-5">
              <EditTaskForm
                task={{
                  id: task.id,
                  topic: task.topic,
                  description: task.description,
                  clientId: task.client.id,
                  assignedToId: task.assignedToId,
                  deadline: task.deadline.toISOString(),
                  type: task.type,
                  slideCount: task.slideCount,
                  status: task.status,
                  referenceLink: task.referenceLink,
                  submissionLink: task.submissionLink,
                  payAmount: task.payAmount,
                }}
                clients={clients}
                employees={employees}
                taskTypes={taskTypes}
                isAdmin={isAdmin}
              />
            </div>
          </details>
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

          {task.payAmount != null && task.payStatus !== "PENDING" && (
            <div className="card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Task pay
              </p>
              <p className="mt-2 text-lg font-extrabold text-ink">{inr(task.payAmount ?? 0)}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-ok">Approved</p>
            </div>
          )}

          {task.missReason && (
            <div className="card border-amber-200/70 bg-warn-soft/40 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Delay reason — {assignee?.name ?? "assignee"}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
                “{task.missReason}”
              </p>
            </div>
          )}

          {(task.referenceLink || task.submissionLink) && (
            <div className="card p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">Links</p>
              <div className="space-y-2">
                {task.referenceLink && (
                  <a
                    href={safeHref(task.referenceLink)}
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
                    href={safeHref(task.submissionLink)}
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
