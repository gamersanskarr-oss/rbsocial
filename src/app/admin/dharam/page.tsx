import {
  bucketByMonth,
  getFinanceSettings,
  listDisbursements,
  listExpenses,
  listPayments,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { deleteDisbursement, updateFinanceSettings } from "@/app/actions/finance";
import { PageHeader, Card } from "@/components/ui";
import { ToastForm } from "@/components/toast";
import AddDisbursementForm from "./add-disbursement-form";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default async function DharamPage() {
  const user = await requireAdminOrAccountant();
  const [payments, expenses, settings, disbursements] = await Promise.all([
    listPayments(),
    listExpenses(),
    getFinanceSettings(),
    listDisbursements(),
  ]);

  const buckets = [...bucketByMonth(payments, expenses).values()].sort((a, b) =>
    b.month.localeCompare(a.month)
  );
  const accrued = buckets.reduce(
    (s, b) => s + Math.max(0, b.net) * (settings.dharamPercent / 100),
    0
  );
  const disbursed = disbursements.reduce((s, d) => s + d.amount, 0);
  const balance = accrued - disbursed;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dharam"
        subtitle={`${settings.dharamPercent}% of every profitable month is set aside for giving.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Total set aside" value={inr(accrued)} hint="all-time allocations" />
        <Card title="Contributed" value={inr(disbursed)} hint={`${disbursements.length} disbursements`} />
        <Card title="Available fund" value={inr(balance)} hint="to be disbursed" />
      </div>

      <AddDisbursementForm balance={balance} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Monthly allocations</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Month</th>
                <th className="th">Net profit</th>
                <th className="th">Set aside</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {buckets.length === 0 && (
                <tr>
                  <td colSpan={3} className="td py-8 text-center text-faint">
                    No profitable months yet.
                  </td>
                </tr>
              )}
              {buckets.map((b) => {
                const alloc = Math.max(0, b.net) * (settings.dharamPercent / 100);
                return (
                  <tr key={b.month}>
                    <td className="td font-semibold text-ink">{monthLabel(b.month)}</td>
                    <td className={`td font-medium ${b.net >= 0 ? "text-ink" : "text-bad"}`}>
                      {inr(b.net)}
                    </td>
                    <td className="td font-bold text-ink">{inr(alloc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Disbursement ledger</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Date</th>
                <th className="th">Recipient</th>
                <th className="th">Cause</th>
                <th className="th">Amount</th>
                <th className="th w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {disbursements.length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-8 text-center text-faint">
                    Nothing disbursed yet.
                  </td>
                </tr>
              )}
              {disbursements.map((d) => (
                <tr key={d.id} className="transition hover:bg-panel/50">
                  <td className="td text-muted">
                    {d.date.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="td font-semibold text-ink">{d.recipient}</td>
                  <td className="td text-muted">{d.cause ?? "—"}</td>
                  <td className="td font-bold text-ink">{inr(d.amount)}</td>
                  <td className="td">
                    <ToastForm action={deleteDisbursement} success="Disbursement deleted.">
                      <input type="hidden" name="disbursementId" value={d.id} />
                      <button className="text-xs font-semibold text-faint transition hover:text-rose-500">
                        Del
                      </button>
                    </ToastForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-bold text-ink">Settings</h2>
          <ToastForm action={updateFinanceSettings} success="Settings saved." className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-faint">
                Dharam allocation (% of net profit)
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
            <button className="btn-secondary px-4 py-2">Save</button>
          </ToastForm>
        </div>
      )}
    </div>
  );
}
