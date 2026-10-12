import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { PageHeader, StatusBadge } from "@/components/ui";

const firstName = (name: string) => name.split(" ")[0];

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

function payoutLine(missed: number, reduced: boolean, percent: number) {
  if (reduced)
    return `🚨 Full gremlin mode: ${missed} missed deadlines, ${percent}% payout cut active. Time to become a deadline ninja. 🥷`;
  if (missed > 0)
    return `👀 You've used ${missed} of ${MISSED_DEADLINE_LIMIT} strikes. The payout gremlin is stirring… keep it sleeping.`;
  return "✨ Flawless record — zero missed deadlines. The payout gremlin is fast asleep.";
}

export default async function DashboardPage() {
  const user = await requireEmployee();
  await checkMissedDeadlines();

  const tasks = await listTasksForUser(user.id);

  const payout = payoutStatus(user.missedDeadlines);
  const pending = tasks.filter((t) => t.status === "PENDING");
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

      {/* Open tasks */}
      <section>
        <h2 className="section-label mb-3">🔥 Open quests</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.length === 0 && (
            <p className="text-sm font-medium text-faint">
              Nothing here. Go touch grass, you've earned it. 🌱
            </p>
          )}
          {pending.map((t) => {
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
                <p className="mt-1.5 text-xs font-medium text-muted">{t.client.name}</p>
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
