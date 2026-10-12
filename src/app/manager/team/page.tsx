import { listEmployees, listTasksWithRefs } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT } from "@/lib/deadlines";
import { PageHeader, StatusBadge, TeamBadge } from "@/components/ui";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function ManagerTeamPage() {
  await checkMissedDeadlines();

  const [employees, tasks] = await Promise.all([listEmployees(), listTasksWithRefs()]);

  const tasksByAssignee = new Map<string, typeof tasks>();
  for (const t of tasks) {
    tasksByAssignee.set(t.assignedToId, [...(tasksByAssignee.get(t.assignedToId) ?? []), t]);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My team"
        subtitle="Who's on the squad, what they're working on, and who's letting deadlines slip."
      />

      {employees.length === 0 ? (
        <div className="card p-10 text-center text-sm font-medium text-faint">
          No employees yet — the admin adds them from the Employees page.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {employees.map((u) => {
            const mine = tasksByAssignee.get(u.id) ?? [];
            const open = mine.filter((t) => t.status === "PENDING").length;
            const done = mine.filter((t) => t.status === "COMPLETED").length;
            const missed = mine.filter((t) => t.status === "MISSED").length;
            const recent = mine.slice(0, 3);
            const initials = u.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div key={u.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel text-sm font-bold text-ink ring-1 ring-line">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{u.name}</p>
                    <p className="truncate text-xs font-medium text-faint">{u.email}</p>
                  </div>
                  <TeamBadge team={u.team} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-panel px-2 py-2.5">
                    <p className="text-lg font-bold text-ink">{open}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Open</p>
                  </div>
                  <div className="rounded-xl bg-panel px-2 py-2.5">
                    <p className="text-lg font-bold text-ok">{done}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Done</p>
                  </div>
                  <div className="rounded-xl bg-panel px-2 py-2.5">
                    <p className={`text-lg font-bold ${missed > 0 ? "text-bad" : "text-ink"}`}>
                      {missed}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">
                      Missed
                    </p>
                  </div>
                </div>

                {u.missedDeadlines > 0 && (
                  <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-xs font-semibold text-bad">
                    {u.missedDeadlines}/{MISSED_DEADLINE_LIMIT} strikes —{" "}
                    {u.missedDeadlines >= MISSED_DEADLINE_LIMIT
                      ? "payout reduced"
                      : "one more and the payout cut kicks in"}
                  </p>
                )}

                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
                    Recent tasks
                  </p>
                  {recent.length === 0 ? (
                    <p className="text-xs font-medium text-faint">No tasks assigned yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recent.map((t) => (
                        <li key={t.id} className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{t.topic}</p>
                            <p className="truncate text-xs font-medium text-faint">
                              {t.client.name} · due {fmtDate(t.deadline)}
                            </p>
                          </div>
                          <StatusBadge status={t.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
