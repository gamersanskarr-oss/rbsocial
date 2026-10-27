import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth";
import { getTaskDetail, getUser } from "@/lib/data";
import { StatusBadge } from "@/components/ui";
import { deleteRequest } from "@/app/actions/requests";
import SubmitTaskForm from "./submit-form";
import RequestForm from "./request-form";
import ReasonForm from "./reason-form";
import { DueTime } from "@/components/due-time";

function relativeDeadline(deadline: Date) {
  const diffMs = deadline.getTime() - Date.now();
  const hours = Math.abs(diffMs) / 36e5;
  if (hours < 1) return { text: diffMs >= 0 ? "Due within the hour" : "Overdue", urgent: true };
  if (hours < 24) return { text: diffMs >= 0 ? "Due today" : `${Math.ceil(hours)}h overdue`, urgent: true };
  const days = Math.ceil(hours / 24);
  return diffMs >= 0
    ? { text: days === 1 ? "1 day left" : `${days} days left`, urgent: days <= 1 }
    : { text: days === 1 ? "1 day overdue" : `${days} days overdue`, urgent: true };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployee();
  const { id } = await params;

  const task = await getTaskDetail(id);
  if (!task || task.assignedToId !== user.id) notFound();

  const fresh = await getUser(user.id);
  const defaultAmount = task.payAmount ?? fresh?.perPostPay ?? null;

  const isPending = task.status === "PENDING";
  const isCompleted = task.status === "COMPLETED";
  const isMissed = task.status === "MISSED";
  const overdue = isPending && task.deadline < new Date();
  const rel = relativeDeadline(task.deadline);
  const now = new Date();
  const hoursLeft = (task.deadline.getTime() - now.getTime()) / 36e5;
  const requestsOpen = isPending && hoursLeft > 6;

  const clientInitials = task.client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const steps = [
    { label: "Task assigned", done: true, current: false },
    { label: "Design & add your link", done: isCompleted, current: isPending },
    { label: "Completed", done: isCompleted, current: false },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-block text-sm font-semibold text-muted transition hover:text-ink">
        ← Back to my tasks
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-panel text-sm font-bold text-ink ring-1 ring-line">
              {clientInitials}
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink">{task.topic}</h1>
              <p className="mt-0.5 text-sm font-medium text-muted">
                Client: <span className="font-semibold text-ink">{task.client.name}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-label mb-3">Brief</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
              {task.description}
            </p>
          </div>

          {/* Review verdict from admin/manager */}
          {(task.approval === "CHANGES" || task.approval === "REJECTED") && (
            <div
              className={`rounded-2xl border p-5 ${
                task.approval === "REJECTED"
                  ? "border-rose-200/70 bg-bad-soft"
                  : "border-amber-200/70 bg-warn-soft"
              }`}
            >
              <h2
                className={`text-sm font-bold ${
                  task.approval === "REJECTED" ? "text-bad" : "text-warn"
                }`}
              >
                {task.approval === "REJECTED"
                  ? "✗ Submission rejected"
                  : "✏️ Changes requested"}
              </h2>
              {task.reviewNote && (
                <p
                  className={`mt-2 rounded-xl bg-elevated/70 px-4 py-3 text-sm font-medium text-ink`}
                >
                  “{task.reviewNote}”
                </p>
              )}
              <p className="mt-2 text-xs font-semibold text-muted">
                Update your work and submit again below — the deadline was extended by 24h if it
                had already passed.
              </p>
            </div>
          )}

          {(isPending || isMissed) && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-ink">
                {isMissed ? "Submit it late — better than never" : "Complete this task"}
              </h2>
              <p className="mt-1.5 mb-5 text-sm font-medium text-muted">
                {isMissed
                  ? "The deadline slipped, but your work still counts. Paste the final link and submit — it'll be marked as a late submission."
                  : "Paste the final design link (e.g. your Canva link) and mark the task as completed."}
              </p>
              <SubmitTaskForm taskId={task.id} defaultAmount={defaultAmount} />
            </div>
          )}

          {isCompleted && (
            <div
              className={`rounded-2xl border p-6 ${
                task.lateSubmission
                  ? "border-amber-200/70 bg-warn-soft"
                  : "border-emerald-200/70 bg-ok-soft"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                    task.lateSubmission ? "bg-warn" : "bg-ok-soft0"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <h2 className={`text-sm font-bold ${task.lateSubmission ? "text-warn" : "text-ok"}`}>
                  {task.lateSubmission
                    ? "Task completed — submitted late ⚠"
                    : "Task completed"}
                </h2>
              </div>
              <p className={`mt-3 text-sm font-medium ${task.lateSubmission ? "text-warn" : "text-ok"}`}>
                Submitted on {task.completedAt?.toLocaleDateString()}
                {task.lateSubmission && " — after the deadline"}
              </p>
              {task.approval === "APPROVED" ? (
                <p className="mt-1 text-sm font-bold text-ok">
                  ✓ Approved by your manager{task.reviewNote ? ` — “${task.reviewNote}”` : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-muted">
                  ⏳ Waiting for your manager to review this submission.
                </p>
              )}
              {task.payStatus === "PENDING" ? (
                <p className="mt-1 text-sm font-semibold text-warn">
                  ⏳ ₹{(task.payAmount ?? 0).toLocaleString("en-IN")} quoted — waiting for
                  approval. Counts as base rate until then.
                </p>
              ) : (
                (task.payAmount ?? defaultAmount) != null && (
                  <p className="mt-1 text-sm font-semibold text-ok">
                    💰 Earned ₹{(task.payAmount ?? defaultAmount)!.toLocaleString("en-IN")} on
                    this task
                  </p>
                )
              )}
              {task.submissionLink && (
                <a
                  href={task.submissionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="link mt-2 inline-block break-all text-sm"
                >
                  {task.submissionLink} ↗
                </a>
              )}
            </div>
          )}

          {/* Missed/late — explain why (manager can see this) */}
          {(task.status === "MISSED" || overdue) && (
            <div
              className={`card border p-6 ${
                task.status === "MISSED" ? "border-rose-200/70 bg-bad-soft/40" : "border-amber-200/70 bg-warn-soft/40"
              }`}
            >
              <h2 className="text-sm font-bold text-ink">
                {task.status === "MISSED" ? "⚠️ This task was missed — what happened?" : "⏰ Running late — tell your manager why"}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-muted">
                {task.missReason
                  ? "Your reason is saved — you can update it below."
                  : "One honest line is enough — it shows up on the manager's task view."}
              </p>
              {task.missReason && (
                <p className="mt-3 rounded-xl border border-line bg-panel/70 px-4 py-3 text-sm font-medium text-ink">
                  “{task.missReason}”
                </p>
              )}
              <ReasonForm taskId={task.id} existing={task.missReason} />
            </div>
          )}

          {/* Requests to admin */}
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">Need something from admin?</h2>
              {task.requests.some((r) => r.status === "OPEN") && (
                <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-line">
                  {task.requests.filter((r) => r.status === "OPEN").length} open
                </span>
              )}
            </div>
            <p className="mt-1.5 mb-5 text-sm font-medium text-muted">
              Missing a logo, asset or detail? Ask the admin here — it will show up on their
              Requests list.
            </p>

            <ul className="mb-5 space-y-2">
              {task.requests.length === 0 && (
                <li className="rounded-xl bg-panel/60 px-4 py-3 text-sm font-medium text-faint">
                  No requests yet for this task.
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
                      {r.createdAt?.toLocaleDateString()}{" "}
                      {r.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.status === "RESOLVED" ? (
                      <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok ring-1 ring-inset ring-ok-line">
                        Resolved
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-line">
                          Waiting
                        </span>
                        <form action={deleteRequest}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <button
                            title="Delete request"
                            className="rounded-lg p-1.5 text-faint transition hover:bg-hover hover:text-ink"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden>
                              <path d="M18 6L6 18" />
                              <path d="M6 6l12 12" />
                            </svg>
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {requestsOpen ? (
              <RequestForm taskId={task.id} />
            ) : (
              <p className="rounded-xl bg-panel/60 px-4 py-3 text-sm font-medium text-muted">
                {isPending
                  ? "Requests are closed for this task — the deadline is less than 6 hours away."
                  : "This task is closed, so new requests can't be added."}
              </p>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Deadline */}
          <div
            className={`card p-5 ${
              isCompleted
                ? ""
                : overdue
                  ? "border-rose-200/70 bg-bad-soft"
                  : rel.urgent
                    ? "border-amber-200/70 bg-warn-soft"
                    : ""
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Deadline</p>
            {!isCompleted && (
              <p
                className={`mt-2 text-2xl font-bold tracking-tight ${
                  overdue ? "text-bad" : rel.urgent ? "text-warn" : "text-ink"
                }`}
              >
                {rel.text}
              </p>
            )}
            {isCompleted && (
              <p
                className={`mt-2 text-sm font-semibold ${
                  task.lateSubmission ||
                  (task.completedAt && task.completedAt > task.deadline)
                    ? "text-bad"
                    : "text-ok"
                }`}
              >
                {task.lateSubmission ||
                (task.completedAt && task.completedAt > task.deadline)
                  ? "Late submission ⚠ — was missed"
                  : "Submitted in time ✓"}
              </p>
            )}
            <p className="mt-1 text-xs font-medium text-muted">
              <DueTime iso={task.deadline.toISOString()} />
            </p>
          </div>

          {/* Progress */}
          <div className="card p-5">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-faint">Progress</p>
            <ol className="space-y-0">
              {steps.map((s, i) => (
                <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < steps.length - 1 && (
                    <span
                      className={`absolute left-[7px] top-5 h-full w-0.5 ${
                        s.done ? "bg-ink" : "bg-line"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      s.done
                        ? "border-ink bg-ink"
                        : s.current
                          ? "border-ink bg-elevated"
                          : "border-line bg-elevated"
                    }`}
                  >
                    {s.done && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      s.done ? "text-ink" : s.current ? "text-ink" : "text-faint"
                    }`}
                  >
                    {s.label}
                    {s.current && (
                      <span className="mt-0.5 block text-xs font-medium text-muted">
                        {overdue ? "Deadline passed — submit as soon as possible" : "Add your link below when ready"}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Links */}
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
