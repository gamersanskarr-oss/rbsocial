import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth";
import { getTaskDetail } from "@/lib/data";
import { StatusBadge } from "@/components/ui";
import { deleteRequest } from "@/app/actions/requests";
import SubmitTaskForm from "./submit-form";
import RequestForm from "./request-form";

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

  const isPending = task.status === "PENDING";
  const isCompleted = task.status === "COMPLETED";
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

          {isPending && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-ink">Complete this task</h2>
              <p className="mt-1.5 mb-5 text-sm font-medium text-muted">
                Paste the final design link (e.g. your Canva link) and mark the task as completed.
              </p>
              <SubmitTaskForm taskId={task.id} />
            </div>
          )}

          {isCompleted && (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <h2 className="text-sm font-bold text-emerald-800">Task completed</h2>
              </div>
              <p className="mt-3 text-sm font-medium text-emerald-800">
                Submitted on {task.completedAt?.toLocaleDateString()}
              </p>
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

          {/* Requests to admin */}
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">Need something from admin?</h2>
              {task.requests.some((r) => r.status === "OPEN") && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/60">
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
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/60">
                        Resolved
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/60">
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
                  ? "border-rose-200/70 bg-rose-50"
                  : rel.urgent
                    ? "border-amber-200/70 bg-amber-50"
                    : ""
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Deadline</p>
            {!isCompleted && (
              <p
                className={`mt-2 text-2xl font-bold tracking-tight ${
                  overdue ? "text-rose-700" : rel.urgent ? "text-amber-700" : "text-ink"
                }`}
              >
                {rel.text}
              </p>
            )}
            {isCompleted && (
              <p className="mt-2 text-sm font-semibold text-emerald-700">Submitted in time ✓</p>
            )}
            <p className="mt-1 text-xs font-medium text-muted">
              {task.deadline.toLocaleDateString()}{" "}
              {task.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                          ? "border-ink bg-white"
                          : "border-line bg-white"
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
