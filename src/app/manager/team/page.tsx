import Link from "next/link";
import { listEmployees, listTasksWithRefs } from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT } from "@/lib/deadlines";
import { waiveMiss } from "@/app/actions/admin";
import { PageHeader, StatusBadge, TeamBadge } from "@/components/ui";
import { ToastForm } from "@/components/toast";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function ManagerTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; team?: string; risk?: string }>;
}) {
  await checkMissedDeadlines();

  const { q, team, risk } = await searchParams;
  const [employees, tasks] = await Promise.all([listEmployees(), listTasksWithRefs()]);

  const tasksByAssignee = new Map<string, typeof tasks>();
  for (const t of tasks) {
    tasksByAssignee.set(t.assignedToId, [...(tasksByAssignee.get(t.assignedToId) ?? []), t]);
  }

  const query = (q ?? "").trim().toLowerCase();
  const teamFilter = team === "DESIGN" || team === "IT" ? team : "";
  const riskOnly = risk === "1";
  const filtering = Boolean(query || teamFilter || riskOnly);

  const visible = employees.filter((e) => {
    if (query && !e.name.toLowerCase().includes(query) && !e.email.toLowerCase().includes(query))
      return false;
    if (teamFilter && e.team !== teamFilter) return false;
    if (riskOnly && e.missedDeadlines === 0) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="My team"
        subtitle="Who's on the squad, what they're working on, and who's letting deadlines slip."
      />

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Search</label>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Name or email"
              className="input w-auto min-w-48 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Team</label>
            <select name="team" defaultValue={teamFilter} className="input w-auto px-3 py-2 text-sm">
              <option value="">All teams</option>
              <option value="DESIGN">Graphic Design</option>
              <option value="IT">IT Team</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Misses</label>
            <select name="risk" defaultValue={riskOnly ? "1" : ""} className="input w-auto px-3 py-2 text-sm">
              <option value="">Everyone</option>
              <option value="1">Has misses only</option>
            </select>
          </div>
          <button className="btn-primary px-4 py-2">Apply filters</button>
          <Link
            href="/manager/team"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            Reset
          </Link>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line bg-panel/70 px-5 py-3.5">
          <h2 className="text-sm font-bold text-ink">
            {filtering ? `Filtered (${visible.length})` : `All employees (${visible.length})`}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Employee</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Team</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Open</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Done</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Missed</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Strikes</th>
                <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Latest task</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-faint">
                    {filtering ? "No employees match these filters." : "No employees yet."}
                  </td>
                </tr>
              )}
              {visible.map((u) => {
                const mine = tasksByAssignee.get(u.id) ?? [];
                const open = mine.filter((t) => t.status === "PENDING").length;
                const done = mine.filter((t) => t.status === "COMPLETED").length;
                const missed = mine.filter((t) => t.status === "MISSED").length;
                const latest = mine[0];
                const initials = u.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <tr key={u.id} className="transition hover:bg-panel/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel text-[11px] font-bold text-ink ring-1 ring-line">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">{u.name}</p>
                          <p className="truncate text-xs font-medium text-faint">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <TeamBadge team={u.team} />
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-ink">{open}</td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-ok">{done}</td>
                    <td className={`px-4 py-2.5 text-[13px] font-semibold ${missed > 0 ? "text-bad" : "text-muted"}`}>
                      {missed}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.missedDeadlines > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                              u.missedDeadlines >= MISSED_DEADLINE_LIMIT
                                ? "bg-bad-soft text-bad ring-bad-line"
                                : "bg-warn-soft text-warn ring-warn-line"
                            }`}
                          >
                            {u.missedDeadlines}/{MISSED_DEADLINE_LIMIT}
                            {u.missedDeadlines >= MISSED_DEADLINE_LIMIT ? " · cut" : ""}
                          </span>
                          <ToastForm action={waiveMiss} success="One strike waived.">
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="mode" value="one" />
                            <button
                              title="Waive one missed deadline"
                              className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-panel"
                            >
                              Waive 1
                            </button>
                          </ToastForm>
                          <ToastForm action={waiveMiss} success="All strikes cleared.">
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="mode" value="all" />
                            <button
                              title="Clear all missed deadlines"
                              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition hover:bg-hover hover:text-ink"
                            >
                              Reset
                            </button>
                          </ToastForm>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-faint">clean</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {latest ? (
                        <div className="flex items-center gap-2.5">
                          <div className="min-w-0">
                            <p className="max-w-52 truncate text-[13px] font-semibold text-ink">
                              {latest.topic}
                            </p>
                            <p className="truncate text-xs font-medium text-faint">
                              {latest.client.name} · due {fmtDate(latest.deadline)}
                            </p>
                          </div>
                          <StatusBadge status={latest.status} />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-faint">No tasks yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
