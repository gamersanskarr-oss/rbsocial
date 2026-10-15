import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { StatusBadge } from "@/components/ui";
import { TimeGreeting } from "@/components/time-greeting";

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

function payoutLine(missed: number, reduced: boolean, percent: number) {
  if (reduced)
    return `🚨 ${missed} missed deadlines — ${percent}% payout cut is active. Submit on time to stay safe.`;
  if (missed > 0)
    return `👀 You've missed ${missed} of ${MISSED_DEADLINE_LIMIT} allowed deadlines. Be careful — one more affects your pay.`;
  return "✨ No missed deadlines. Keep it up this month for a +10% bonus. 🎁";
}

export default async function DashboardPage() {
  const user = await requireEmployee();
  await checkMissedDeadlines();

  const tasks = await listTasksForUser(user.id);

  const payout = payoutStatus(user.missedDeadlines);
  const pending = tasks.filter((t) => t.status === "PENDING");
  const urgent = pending.filter((t) => t.deadline.getTime() - Date.now() < 48 * 36e5);
  const rest = pending.filter((t) => t.deadline.getTime() - Date.now() >= 48 * 36e5);
  const done = tasks.filter((t) => t.status !== "PENDING");
  const completed = done.filter((t) => t.status === "COMPLETED").length;

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
          <p className="text-2xl">{user.missedDeadlines === 0 ? "😌" : "😬"}</p>
          <p className="mt-1 text-xl font-extrabold text-ink">
            {user.missedDeadlines}/{MISSED_DEADLINE_LIMIT}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Missed</p>
          <p className="mt-0.5 text-[10px] font-medium text-faint">≤1 per month keeps your bonus</p>
        </div>
      </div>

      {/* Deadline / payout status */}
      <div
        className={`rounded-2xl border p-4 text-sm font-medium ${
          payout.reduced
            ? "border-rose-200 bg-bad-soft text-bad"
            : user.missedDeadlines > 0
              ? "border-amber-200 bg-warn-soft text-warn"
              : "border-emerald-200 bg-ok-soft text-ok"
        }`}
      >
        {payoutLine(user.missedDeadlines, payout.reduced, payout.percent)}
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
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                        overdue ? "bg-white text-rose-600" : "bg-white/20 text-white"
                      }`}
                    >
                      {timeLeft(t.deadline)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Open tasks — grouped per client */}
      <section>
        <h2 className="section-label mb-3">🔥 Open tasks</h2>
        {pending.length === 0 && (
          <p className="text-sm font-medium text-faint">
            Nothing pending — you're all done. 🌱
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
                <p className={`mt-4 text-xs font-semibold ${overdue ? "text-bad" : "text-faint"}`}>
                  Due {t.deadline.toLocaleDateString()}{" "}
                  {t.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                      Nothing here yet — your finished tasks will show up here. 🥇
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
                    <td className="td text-muted">{t.deadline.toLocaleDateString()}</td>
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
