import {
  clientCountsByAssignee,
  listAllUsers,
  taskCountsByAssignee,
} from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { requireAdmin } from "@/lib/auth";
import { setPerPostPay, waiveMiss } from "@/app/actions/admin";
import { PageHeader, TeamBadge } from "@/components/ui";
import AddEmployeeForm from "./add-employee-form";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Admin", cls: "bg-ink text-canvas" },
  MANAGER: { label: "Manager", cls: "bg-info-soft text-info ring-1 ring-inset ring-info-line" },
  ACCOUNTANT: {
    label: "Accountant",
    cls: "bg-warn-soft text-warn ring-1 ring-inset ring-warn-line",
  },
  EMPLOYEE: { label: "Employee", cls: "bg-panel text-muted ring-1 ring-inset ring-line" },
};

export default async function EmployeesPage() {
  await requireAdmin();
  await checkMissedDeadlines();

  const [users, completedCount, clientCount] = await Promise.all([
    listAllUsers(),
    taskCountsByAssignee("COMPLETED"),
    clientCountsByAssignee(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        subtitle="Everyone with a login — employees, managers, accountant and admins."
      />

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-bold text-ink">Add user</h2>
        <AddEmployeeForm />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Name</th>
                <th className="th">Role</th>
                <th className="th">Team</th>
                <th className="th">Email (login)</th>
                <th className="th">Per-post pay</th>
                <th className="th">Earned</th>
                <th className="th">Clients</th>
                <th className="th">Missed deadlines</th>
                <th className="th">Payout status</th>
                <th className="th">Waive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={10}>
                    No users yet — add your first team member above.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.EMPLOYEE;
                const isEmployee = u.role === "EMPLOYEE";
                const payout = payoutStatus(u.missedDeadlines);
                return (
                  <tr key={u.id} className="transition hover:bg-panel/60">
                    <td className="td font-semibold text-ink">{u.name}</td>
                    <td className="td">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="td">
                      {isEmployee ? <TeamBadge team={u.team} /> : <span className="text-xs text-faint">—</span>}
                    </td>
                    <td className="td text-muted">{u.email}</td>
                    {isEmployee ? (
                      <>
                        <td className="td">
                          <form action={setPerPostPay} className="flex items-center gap-1.5">
                            <input type="hidden" name="userId" value={u.id} />
                            <span className="text-xs font-semibold text-faint">₹</span>
                            <input
                              name="perPostPay"
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={u.perPostPay ?? ""}
                              placeholder="—"
                              className="input w-20 px-2 py-1.5 text-sm"
                            />
                            <button
                              title="Save per-post pay"
                              className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
                            >
                              Save
                            </button>
                          </form>
                        </td>
                        <td className="td">
                          {u.perPostPay != null ? (
                            <span className="font-semibold text-ok">
                              ₹{((u.perPostPay ?? 0) * (completedCount.get(u.id) ?? 0)).toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-xs text-faint">—</span>
                          )}
                        </td>
                        <td className="td font-medium text-ink">{clientCount.get(u.id) ?? 0}</td>
                        <td className="td">
                          <span
                            className={
                              u.missedDeadlines > 0
                                ? "font-bold text-bad"
                                : "font-medium text-muted"
                            }
                          >
                            {u.missedDeadlines} / {MISSED_DEADLINE_LIMIT}
                          </span>
                        </td>
                        <td className="td">
                          {payout.reduced ? (
                            <span className="inline-block rounded-full bg-bad-soft px-2.5 py-1 text-xs font-semibold text-bad ring-1 ring-inset ring-bad-line">
                              −{payout.percent}% payout
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-faint">Full payout</span>
                          )}
                        </td>
                        <td className="td">
                          {u.missedDeadlines > 0 ? (
                            <div className="flex items-center gap-2">
                              <form action={waiveMiss}>
                                <input type="hidden" name="userId" value={u.id} />
                                <input type="hidden" name="mode" value="one" />
                                <button
                                  title="Waive one missed deadline (valid reason)"
                                  className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
                                >
                                  Waive 1
                                </button>
                              </form>
                              <form action={waiveMiss}>
                                <input type="hidden" name="userId" value={u.id} />
                                <input type="hidden" name="mode" value="all" />
                                <button
                                  title="Clear all missed deadlines"
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-hover hover:text-ink"
                                >
                                  Reset
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-faint">—</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="td text-xs text-faint">—</td>
                        <td className="td text-xs text-faint">—</td>
                        <td className="td text-xs text-faint">—</td>
                        <td className="td text-xs text-faint">—</td>
                        <td className="td text-xs text-faint">—</td>
                        <td className="td text-xs text-faint">—</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs font-medium text-muted">
        Policy: an employee who misses {MISSED_DEADLINE_LIMIT} deadlines gets a{" "}
        {payoutStatus(MISSED_DEADLINE_LIMIT).percent}% payout reduction. Use &quot;Waive 1&quot;
        or &quot;Reset&quot; to excuse misses when there is a valid reason.
      </p>
    </div>
  );
}
