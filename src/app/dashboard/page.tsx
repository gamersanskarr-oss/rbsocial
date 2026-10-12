import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { PageHeader, StatusBadge } from "@/components/ui";

const firstName = (name: string) => name.split(" ")[0];

function groupByClient<T extends { client: { name: string } }>(tasks: T[]) {
  const map = new Map<string, T[]>();
  for (const t of tasks) {
    const key = t.client.name || "No client";
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function greeting(pending: number) {
  const h = new Date().getHours();
  const tod = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const vibe =
    pending === 0
      ? "Zero tasks on your plate — either you're a machine or admin's on a break. 🌴"
      : pending <= 3
        ? `${pending} quest${pending === 1 ? "" : "s"} waiting. Small mountain, big you. ⛰️`
        : `${pending} tasks?! Okay, admin really believes in you. No pressure. 😅`;
  return { tod, vibe };
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
    return `🚨 Full gremlin mode: ${missed} missed deadlines, ${percent}% payout cut active. Time to become a deadline ninja. 🥷`;
  if (missed > 0)
    return `👀 You've used ${missed} of ${MISSED_DEADLINE_LIMIT} strikes. The payout gremlin is stirring… keep it sleeping.`;
  return "✨ Flawless record — zero missed deadlines. Keep the month clean for a +10% bonus. 🎁";
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
  const shipped = done.filter((t) => t.status === "COMPLETED").length;
  const { tod, vibe } = greeting(pending.length);

  return (
    <div className="space-y-8">
      <PageHeader title={`${tod}, ${firstName(user.name)} 👋`} subtitle={vibe} />

      {/* vibe stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl">🎯</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{pending.length}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Open quests</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{shipped}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Shipped</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl">{user.missedDeadlines === 0 ? "😌" : "😬"}</p>
          <p className="mt-1 text-xl font-extrabold text-ink">
            {user.missedDeadlines}/{MISSED_DEADLINE_LIMIT}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Strikes used</p>
          <p className="mt-0.5 text-[10px] font-medium text-faint">≤1/mo keeps your +10% bonus</p>
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
              🚨 Drop everything — {urgent.length} urgent task{urgent.length === 1 ? "" : "s"}
            </h2>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              next 48 hours
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-white/80">
              These are burning. Finish them before the gremlin wakes up.
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
        <h2 className="section-label mb-3">🔥 Open quests</h2>
        {pending.length === 0 && (
          <p className="text-sm font-medium text-faint">
            Nothing here. Go touch grass, you've earned it. 🌱
          </p>
        )}
        {rest.length === 0 && pending.length > 0 && (
          <p className="text-sm font-medium text-faint">
            Everything left is up in the urgent zone ☝️ — nothing calm on the board.
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
                      {t.type}
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
        <h2 className="section-label mb-3">🏆 Trophy shelf</h2>
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
                      Empty shelf. First win incoming. 🥇
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
