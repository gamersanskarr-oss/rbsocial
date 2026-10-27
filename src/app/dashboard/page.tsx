import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { getUser, listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { StatusBadge } from "@/components/ui";
import { TimeGreeting } from "@/components/time-greeting";
import { DueTime } from "@/components/due-time";

const firstName = (name: string) => name.split(" ")[0];

function groupByClient<T extends { client: { name: string } }>(tasks: T[]) {
  const map = new Map<string, T[]>();
  for (const t of tasks) {
    const key = t.client.name || "No client";
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

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
  percent: number
) {
  // openMissed = tasks still flagged MISSED (not yet submitted). The banner
  // must stay honest even when the strike counter was waived/reset.
  const openNote =
    openMissed > 0
      ? ` ${openMissed} missed ${openMissed === 1 ? "task" : "tasks"} still open — late submissions still count.`
      : "";
  if (reduced)
    return `🚨 ${missed} missed deadlines — ${percent}% payout cut is active.${openNote}`;
  if (missed > 0)
    return `👀 You've missed ${missed} of ${MISSED_DEADLINE_LIMIT} allowed deadlines — one more affects your pay.${openNote}`;
  if (openMissed > 0)
    return `⚠️${openNote} Your strike counter is clean — no payout impact.`;
  return "✨ No missed deadlines. Keep it up this month for a +10% bonus. 🎁";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireEmployee();
  await checkMissedDeadlines();
  // The scan above may have just flipped tasks to MISSED and bumped the
  // strike counter — re-read the user so stats show fresh numbers.
  const missedCount = (await getUser(user.id))?.missedDeadlines ?? user.missedDeadlines;

  const allTasks = await listTasksForUser(user.id);

  // Filters — client-wise and status-wise
  const sp = await searchParams;
  const fClient = typeof sp.client === "string" ? sp.client : "";
  const fStatus = typeof sp.status === "string" ? sp.status : "";
  const clientNames = [...new Set(allTasks.map((t) => t.client.name))].sort();
  const filtering = Boolean(fClient || fStatus);
  const tasks = allTasks.filter(
    (t) => (!fClient || t.client.name === fClient) && (!fStatus || t.status === fStatus)
  );

  const payout = payoutStatus(missedCount);
  // Missed tasks stay actionable — the employee can still submit them late
  const pending = tasks.filter((t) => t.status !== "COMPLETED");
  const urgent = pending.filter(
    (t) => t.status === "MISSED" || t.deadline.getTime() - Date.now() < 48 * 36e5
  );
  const rest = pending.filter(
    (t) => t.status !== "MISSED" && t.deadline.getTime() - Date.now() >= 48 * 36e5
  );
  const done = tasks.filter((t) => t.status === "COMPLETED");
  const completed = done.length;
  // Tasks still flagged MISSED (waiting for a late submission) — the strike
  // counter can be waived, but these stay honest.
  const openMissed = allTasks.filter((t) => t.status === "MISSED").length;

  return (
    <div className="space-y-8">
      <TimeGreeting name={firstName(user.name)} pending={pending.length} />

      {/* vibe stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl">🎯</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{pending.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Tasks to do</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{completed}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Done</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">{missedCount === 0 && openMissed === 0 ? "😌" : "😬"}</p>
          <p className="mt-1 text-xl font-extrabold text-ink">
            {missedCount}/{MISSED_DEADLINE_LIMIT}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Missed</p>
          <p className="mt-0.5 text-[10px] font-medium text-faint">
            {openMissed > 0 ? `${openMissed} still open · ` : ""}≤1 per month keeps your bonus
          </p>
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

      {/* Filters */}
      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-faint">Client</label>
          <select name="client" defaultValue={fClient} className="input w-auto min-w-40 px-3 py-2 text-sm">
            <option value="">All clients</option>
            {clientNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-faint">Status</label>
          <select name="status" defaultValue={fStatus} className="input w-auto px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
        </div>
        <button className="btn-primary px-4 py-2 text-sm">Apply</button>
        {filtering && (
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            Clear
          </Link>
        )}
        {filtering && (
          <span className="pb-2 text-xs font-semibold text-faint">
            {tasks.length} task{tasks.length === 1 ? "" : "s"} match
          </span>
        )}
      </form>

      {/* Open tasks — grouped per client */}
      <section>
        <h2 className="section-label mb-3">🔥 Open tasks</h2>
        {pending.length === 0 && (
          <p className="text-sm font-medium text-faint">
            {filtering ? "No open tasks match these filters." : "Nothing pending — you're all done. 🌱"}
          </p>
        )}
        {rest.length === 0 && pending.length > 0 && (
          <p className="text-sm font-medium text-faint">
            All your tasks are in the urgent section above ☝️
          </p>
        )}
        <div className="space-y-6">
          {[...groupByClient(rest).entries()].map(([clientName, clientTasks]) => (
            <div key={clientName}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  {clientName}
                </h3>
                <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold text-muted ring-1 ring-inset ring-line">
                  {clientTasks.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {clientTasks.map((t) => {
            const overdue = t.deadline < new Date();
            return (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="card block p-5 hover:-translate-y-0.5 hover:border-[#dcd8d1] hover:shadow-lift"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{t.topic}</h3>
                  <StatusBadge status={t.status} />
                </div>
                {t.type && (
                  <p className="mt-1.5">
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand ring-1 ring-inset ring-brand-line">
                      {t.type}{t.slideCount ? ` · ${t.slideCount} slides` : ""}
                    </span>
                  </p>
                )}
                {t.requests.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-warn">
                    📬 {t.requests.length} request{t.requests.length === 1 ? "" : "s"} waiting on
                    admin
                  </p>
                )}
                {(t.approval === "CHANGES" || t.approval === "REJECTED") && t.reviewNote && (
                  <p
                    className={`mt-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                      t.approval === "REJECTED"
                        ? "bg-bad-soft text-bad"
                        : "bg-warn-soft text-warn"
                    }`}
                  >
                    {t.approval === "REJECTED" ? "✗ Rejected" : "✏️ Fix"}: {t.reviewNote}
                  </p>
                )}
                <p className={`mt-4 text-xs font-semibold ${overdue ? "text-bad" : "text-faint"}`}>
                  Due <DueTime iso={t.deadline.toISOString()} />
                  {overdue ? " · overdue 👀" : ""}
                </p>
              </Link>
            );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past tasks */}
      <section>
        <h2 className="section-label mb-3">🏆 Finished tasks</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-panel/70">
                <tr>
                  <th className="th">Topic</th>
                  <th className="th">Client</th>
                  <th className="th">Deadline</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {done.length === 0 && (
                  <tr>
                    <td className="td py-10 text-center text-faint" colSpan={4}>
                      {filtering
                        ? "No finished tasks match these filters."
                        : "Nothing here yet — your finished tasks will show up here. 🥇"}
                    </td>
                  </tr>
                )}
                {done.map((t) => (
                  <tr key={t.id} className="transition hover:bg-panel/60">
                    <td className="td">
                      <Link href={`/dashboard/tasks/${t.id}`} className="link">
                        {t.topic}
                      </Link>
                      {t.type && (
                        <span className="ml-1.5 rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold text-muted ring-1 ring-inset ring-line">
                          {t.type}
                        </span>
                      )}
                    </td>
                    <td className="td font-medium text-ink">{t.client.name}</td>
                    <td className="td text-muted">
                      <DueTime iso={t.deadline.toISOString()} dateOnly />
                    </td>
                    <td className="td"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
