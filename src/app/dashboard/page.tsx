import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { getUser, listTasksForUser } from "@/lib/data";
import { computeEarnings } from "@/lib/earnings";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { TimeGreeting } from "@/components/time-greeting";
import { DueTime } from "@/components/due-time";

const firstName = (name: string) => name.split(" ")[0];

function timeLeft(d: Date) {
  const ms = d.getTime() - Date.now();
  const h = Math.abs(ms) / 36e5;
  if (ms < 0) return h < 24 ? `${Math.ceil(h)}h overdue` : `${Math.ceil(h / 24)}d overdue`;
  if (h < 1) return "due within the hour";
  if (h < 24) return `due in ${Math.ceil(h)}h`;
  return `due in ${Math.ceil(h / 24)}d`;
}

function payoutLine(
  missed: number,
  openMissed: number,
  reduced: boolean,
  percent: number,
) {
  if (reduced) return `Payout reduced by ${percent}% — ${missed} missed deadlines. Waive eligible misses from your manager.`;
  if (openMissed > 0) return `${openMissed} task${openMissed === 1 ? "" : "s"} still flagged MISSED — submit them late, better than never.`;
  if (missed > 0) return `${missed} missed deadline${missed === 1 ? "" : "s"} this month — ≤1 keeps your on-time bonus.`;
  return "Clean record — no missed deadlines. On-time bonus track. 🌱";
}

export default async function OverviewPage() {
  const user = await requireEmployee();
  await checkMissedDeadlines();

  const [fresh, allTasks] = await Promise.all([getUser(user.id), listTasksForUser(user.id)]);

  const missedCount = fresh?.missedDeadlines ?? 0;
  const payout = payoutStatus(missedCount);
  const summary = computeEarnings(allTasks, fresh?.perPostPay ?? null, missedCount);

  const pending = allTasks.filter((t) => t.status !== "COMPLETED");
  const done = allTasks.filter((t) => t.status === "COMPLETED");
  const openMissed = allTasks.filter((t) => t.status === "MISSED").length;

  // Urgent — overdue or due within 48h
  const nowMs = Date.now(); // eslint-disable-line react-hooks/purity
  const urgent = pending.filter(
    (t) => t.status === "MISSED" || t.deadline.getTime() - nowMs < 48 * 36e5,
  );

  const inReview = done.filter((t) => t.approval === "PENDING").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TimeGreeting name={firstName(user.name)} pending={pending.length} />
        {/* Earnings at a glance — full module lives in the Earnings tab */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-panel px-4 py-2 text-xs">
            <span className="font-bold text-ok">₹{summary.totalEarned.toLocaleString("en-IN")}</span>
            <span className="text-faint"> earned</span>
          </span>
          <span className="rounded-full border border-line bg-panel px-4 py-2 text-xs">
            <span className={`font-bold ${summary.pendingAmount > 0 ? "text-warn" : "text-ink"}`}>
              ₹{summary.pendingAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-faint"> pending</span>
          </span>
          <Link
            href="/dashboard/earnings"
            className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            Details →
          </Link>
        </div>
      </div>

      {/* vibe stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl">🎯</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{pending.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Tasks to do</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{done.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Done</p>
          <p className="mt-0.5 text-[10px] font-medium text-faint">
            {inReview > 0 ? `${inReview} awaiting review` : "all reviewed"}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">{missedCount === 0 && openMissed === 0 ? "😌" : "😬"}</p>
          <p className="mt-1 text-xl font-extrabold text-ink">
            {missedCount}/{MISSED_DEADLINE_LIMIT}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Missed</p>
        </div>
      </div>

      {/* Deadline / payout status */}
      <div
        className={`rounded-2xl border p-4 text-sm font-medium ${
          payout.reduced
            ? "border-rose-200 bg-bad-soft text-bad"
            : missedCount > 0 || openMissed > 0
              ? "border-amber-200 bg-warn-soft text-warn"
              : "border-emerald-200 bg-ok-soft text-ok"
        }`}
      >
        {payoutLine(missedCount, openMissed, payout.reduced, payout.percent)}
      </div>

      {/* Urgent tasks — overdue or due within 48h */}
      {urgent.length > 0 && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 p-6 text-white shadow-lift">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight">
              🚨 Urgent — {urgent.length} task{urgent.length === 1 ? "" : "s"} need attention
            </h2>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              next 48 hours
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-white/80">
            Overdue or due very soon — finish these first.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {urgent.map((t) => {
              const overdue = t.deadline < new Date();
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/tasks/${t.id}`}
                  className="rounded-2xl bg-white/15 p-4 ring-1 ring-inset ring-white/25 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/25"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{t.topic}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-white/75">
                        {t.client.name}
                        {t.type ? ` · ${t.type}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-bold text-white/90">
                        Due <DueTime iso={t.deadline.toISOString()} />
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                        overdue ? "bg-white text-rose-600" : "bg-white/20 text-white"
                      }`}
                    >
                      {timeLeft(t.deadline)}
                    </span>
                  </div>
                  {(t.approval === "CHANGES" || t.approval === "REJECTED") && t.reviewNote && (
                    <p className="mt-2 truncate rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px] font-semibold text-white/95">
                      {t.approval === "REJECTED" ? "✗ Rejected" : "✏️ Fix"}: {t.reviewNote}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Pointer to the full task list */}
      <Link
        href="/dashboard/tasks"
        className="card flex items-center justify-between gap-4 p-5 transition duration-200 hover:border-faint/50"
      >
        <div>
          <p className="text-sm font-bold text-ink">All tasks</p>
          <p className="mt-0.5 text-xs font-medium text-muted">
            The full list with client, status and deadline filters.
          </p>
        </div>
        <span className="text-sm font-semibold text-muted transition group-hover:text-ink">View →</span>
      </Link>
    </div>
  );
}
