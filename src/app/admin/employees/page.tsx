import {
  clientCountsByAssignee,
  listEmployees,
  taskCountsByAssignee,
} from "@/lib/data";
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT, payoutStatus } from "@/lib/deadlines";
import { requireAdmin } from "@/lib/auth";
import { setPerPostPay, waiveMiss } from "@/app/actions/admin";
import { PageHeader, TeamBadge } from "@/components/ui";
import AddEmployeeForm from "./add-employee-form";

export default async function EmployeesPage() {
  await requireAdmin();
  await checkMissedDeadlines();

  const [employees, completedCount, clientCount] = await Promise.all([
    listEmployees(),
    taskCountsByAssignee("COMPLETED"),
    clientCountsByAssignee(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Employees" subtitle="Your design and IT team members." />

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-bold text-ink">Add employee</h2>
        <AddEmployeeForm />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Team</th>
                <th className="th">Per-post pay</th>
                <th className="th">Earned</th>
                <th className="th">Clients</th>
                <th className="th">Missed deadlines</th>
                <th className="th">Payout status</th>
                <th className="th">Waive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {employees.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={9}>
                    No employees yet — add your first team member above.
                  </td>
                </tr>
              )}
              {employees.map((e) => {
                const payout = payoutStatus(e.missedDeadlines);
                return (
                  <tr key={e.id} className="transition hover:bg-panel/60">
                    <td className="td font-semibold text-ink">{e.name}</td>
                    <td className="td text-muted">{e.email}</td>
                    <td className="td"><TeamBadge team={e.team} /></td>
                    <td className="td">
                      <form action={setPerPostPay} className="flex items-center gap-1.5">
                        <input type="hidden" name="userId" value={e.id} />
                        <span className="text-xs font-semibold text-faint">₹</span>
                        <input
                          name="perPostPay"
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={e.perPostPay ?? ""}
                          placeholder="—"
                          className="input w-20 px-2 py-1.5 text-sm"
                        />
                        <button
                          title="Save per-post pay"
                          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="td">
                      {e.perPostPay != null ? (
                        <span className="font-semibold text-emerald-700">
                          ₹{((e.perPostPay ?? 0) * (completedCount.get(e.id) ?? 0)).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="td font-medium text-ink">{clientCount.get(e.id) ?? 0}</td>
                    <td className="td">
                      <span className={e.missedDeadlines > 0 ? "font-bold text-rose-600" : "font-medium text-muted"}>
                        {e.missedDeadlines} / {MISSED_DEADLINE_LIMIT}
                      </span>
                    </td>
                    <td className="td">
                      {payout.reduced ? (
                        <span className="inline-block rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200/60">
                          −{payout.percent}% payout
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-faint">Full payout</span>
                      )}
                    </td>
                    <td className="td">
                      {e.missedDeadlines > 0 ? (
                        <div className="flex items-center gap-2">
                          <form action={waiveMiss}>
                            <input type="hidden" name="userId" value={e.id} />
                            <input type="hidden" name="mode" value="one" />
                            <button
                              title="Waive one missed deadline (valid reason)"
                              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
                            >
                              Waive 1
                            </button>
                          </form>
                          <form action={waiveMiss}>
                            <input type="hidden" name="userId" value={e.id} />
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
