import Link from "next/link";
import {
  bucketByMonth,
  ensureMonthlyCharges,
  getFinanceSettings,
  listActivity,
  listDisbursements,
  listExpenses,
  listPaymentsWithClient,
  monthKeyOf,
  paymentStatus,
  processSubscriptions,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { logFollowUp, markPaymentReceived, updateFinanceSettings } from "@/app/actions/finance";
import { Card, PageHeader } from "@/components/ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default async function FinancePage() {
  const user = await requireAdminOrAccountant();
  await ensureMonthlyCharges();
  await processSubscriptions();

  const [payments, expenses, settings, activity, disbursements] = await Promise.all([
    listPaymentsWithClient(),
    listExpenses(),
    getFinanceSettings(),
    listActivity(12),
    listDisbursements(),
  ]);

  const now = new Date();
  const key = monthKeyOf(now);
  const thisMonth = { received: 0, expenses: 0, online: 0, cash: 0 };
  for (const p of payments) {
    if (p.receivedAt && monthKeyOf(p.receivedAt) === key) {
      thisMonth.received += p.amount;
      if (p.method === "CASH") thisMonth.cash += p.amount;
      else thisMonth.online += p.amount;
    }
  }
  for (const e of expenses) {
    if (monthKeyOf(e.date) === key) thisMonth.expenses += e.amount;
  }

  const net = thisMonth.received - thisMonth.expenses;
  const margin = thisMonth.received > 0 ? Math.round((net / thisMonth.received) * 100) : 0;
  const outstanding = payments
    .filter((p) => paymentStatus(p) !== "RECEIVED")
    .reduce((s, p) => s + p.amount, 0);
  const needsAction = payments.filter((p) => {
    const s = paymentStatus(p);
    return s === "OVERDUE" || s === "DUE_TODAY";
  });
  const targetPct =
    settings.monthlyRevenueTarget > 0
      ? Math.min(100, Math.round((thisMonth.received / settings.monthlyRevenueTarget) * 100))
      : null;

  const buckets = [...bucketByMonth(payments, expenses).values()]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);
  const accrued = [...bucketByMonth(payments, expenses).values()].reduce(
    (s, b) => s + Math.max(0, b.net) * (settings.dharamPercent / 100),
    0
  );
  const disbursed = disbursements.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance"
        subtitle="Revenue, expenses, profitability and Dharam — at a glance."
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Received this month" value={inr(thisMonth.received)} hint={monthLabel(key)} />
        <Card title="Outstanding" value={inr(outstanding)} hint="pending + overdue" />
        <Card title="Expenses" value={inr(thisMonth.expenses)} hint={monthLabel(key)} />
        <Card title="Net profit" value={inr(net)} hint={`${margin}% margin`} />
        <Card title="Dharam fund" value={inr(accrued - disbursed)} hint={`${settings.dharamPercent}% of net profit`} />
      </div>

      {/* Revenue target */}
      {settings.monthlyRevenueTarget > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Monthly revenue target</h2>
            <p className="text-sm font-bold text-ink">
              {inr(thisMonth.received)}{" "}
              <span className="font-medium text-faint">
                / {inr(settings.monthlyRevenueTarget)} · {targetPct}%
              </span>
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-ink transition-all duration-700"
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Cash split */}
      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
            Online (bank / UPI)
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{inr(thisMonth.online)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Cash</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{inr(thisMonth.cash)}</p>
        </div>
      </div>

      {/* Overdue / due today */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Needs follow-up</h2>
          <Link href="/admin/payments" className="link text-sm">
            All payments
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {needsAction.length === 0 && (
            <li className="px-5 py-10 text-center text-sm font-medium text-faint">
              Nothing overdue — all collections are on track.
            </li>
          )}
          {needsAction.map((p) => {
            const s = paymentStatus(p);
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {p.client.name} · {inr(p.amount)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {p.forMonth ? `${monthLabel(p.forMonth)} · ` : ""}
                    due {p.dueDate?.toLocaleDateString("en-IN")} · {p.followUps} follow-up
                    {p.followUps === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      s === "OVERDUE"
                        ? "bg-rose-50 text-rose-800 ring-rose-200/60"
                        : "bg-amber-50 text-amber-800 ring-amber-200/60"
                    }`}
                  >
                    {s === "OVERDUE" ? "Overdue" : "Due today"}
                  </span>
                  <form action={logFollowUp}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <button className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel">
                      + Follow-up
                    </button>
                  </form>
                  <form action={markPaymentReceived} className="flex items-center gap-1.5">
                    <input type="hidden" name="paymentId" value={p.id} />
                    <select name="method" className="input w-auto px-2 py-1.5 text-xs" defaultValue="ONLINE">
                      <option value="ONLINE">Online</option>
                      <option value="CASH">Cash</option>
                    </select>
                    <button className="rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black">
                      Received
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly breakdown */}
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Monthly breakdown</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Month</th>
                <th className="th">Received</th>
                <th className="th">Expenses</th>
                <th className="th">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {buckets.length === 0 && (
                <tr>
                  <td className="td py-8 text-center text-faint" colSpan={4}>
                    No financial activity yet.
                  </td>
                </tr>
              )}
              {buckets.map((b) => (
                <tr key={b.month}>
                  <td className="td font-semibold text-ink">{monthLabel(b.month)}</td>
                  <td className="td font-medium text-emerald-700">{inr(b.received)}</td>
                  <td className="td font-medium text-rose-600">{inr(b.expenses)}</td>
                  <td className={`td font-bold ${b.net >= 0 ? "text-ink" : "text-rose-600"}`}>
                    {inr(b.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity feed */}
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Recent activity</h2>
          </div>
          <ul className="divide-y divide-line">
            {activity.length === 0 && (
              <li className="px-5 py-8 text-center text-sm font-medium text-faint">
                No activity yet.
              </li>
            )}
            {activity.map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <p className="text-sm font-medium text-ink">{a.message}</p>
                <p className="mt-0.5 text-xs font-medium text-faint">
                  {a.createdAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                  {a.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Finance settings (owner only) */}
      {user.role === "ADMIN" && (
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-bold text-ink">Finance settings</h2>
          <form action={updateFinanceSettings} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-faint">
                Monthly revenue target (₹)
              </label>
              <input
                name="monthlyRevenueTarget"
                type="number"
                min="0"
                step="1"
                defaultValue={settings.monthlyRevenueTarget || ""}
                className="input w-44 px-3 py-2 text-sm"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-faint">
                Dharam allocation (%)
              </label>
              <input
                name="dharamPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                defaultValue={settings.dharamPercent}
                className="input w-28 px-3 py-2 text-sm"
              />
            </div>
            <button className="btn-secondary px-4 py-2">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
