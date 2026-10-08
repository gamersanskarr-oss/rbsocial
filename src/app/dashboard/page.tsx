import Link from "next/link";
import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireEmployee();
  await checkMissedDeadlines();

  const tasks = await listTasksForUser(user.id);

  const payout = payoutStatus(user.missedDeadlines);
  const pending = tasks.filter((t) => t.status === "PENDING");
  const done = tasks.filter((t) => t.status !== "PENDING");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]}`}
        subtitle={`You have ${pending.length} open task${pending.length === 1 ? "" : "s"}.`}
      />

      {/* Deadline / payout status */}
      <div
        className={`rounded-2xl border p-4 text-sm font-medium ${
          payout.reduced
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : user.missedDeadlines > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        {payout.reduced ? (
          <>
            <strong>Warning:</strong> You have missed {user.missedDeadlines} deadlines. A{" "}
            {payout.percent}% payout reduction is in effect. Complete tasks on time to rebuild
            your record.
          </>
        ) : user.missedDeadlines > 0 ? (
          <>
            You have missed {user.missedDeadlines} of {MISSED_DEADLINE_LIMIT} allowed deadlines.
            Missing {MISSED_DEADLINE_LIMIT} leads to a 10% payout reduction.
          </>
        ) : (
          <>Great record — no missed deadlines. Keep it up!</>
        )}
      </div>

      {/* Open tasks */}
      <section>
        <h2 className="section-label mb-3">Open tasks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.length === 0 && (
            <p className="text-sm font-medium text-faint">No open tasks. Enjoy the calm.</p>
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
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    {t.requests.length} request{t.requests.length === 1 ? "" : "s"} waiting on
                    admin
                  </p>
                )}
                <p className={`mt-4 text-xs font-semibold ${overdue ? "text-rose-600" : "text-faint"}`}>
                  Due {t.deadline.toLocaleDateString()}{" "}
                  {t.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {overdue ? " · overdue" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Past tasks */}
      <section>
        <h2 className="section-label mb-3">Completed &amp; missed</h2>
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
                      Nothing here yet.
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
