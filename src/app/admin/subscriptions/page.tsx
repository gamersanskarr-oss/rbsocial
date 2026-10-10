import { listSubscriptions, processSubscriptions } from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { deleteSubscription, toggleSubscription } from "@/app/actions/finance";
import { PageHeader } from "@/components/ui";
import AddSubscriptionForm from "./add-subscription-form";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function SubscriptionsPage() {
  await requireAdminOrAccountant();
  await processSubscriptions();
  const subs = await listSubscriptions();
  const now = new Date();
  const active = subs.filter((s) => s.active);
  const monthlyCost = active.reduce(
    (s, x) => s + (x.cycle === "YEARLY" ? Math.round(x.amount / 12) : x.amount),
    0
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring SaaS tools — renewals auto-log as expenses."
      />

      <AddSubscriptionForm />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Active subscriptions</h2>
          <span className="text-xs font-semibold text-muted">
            ≈ {inr(monthlyCost)}/month
          </span>
        </div>
        <table className="w-full">
          <thead className="border-b border-line">
            <tr>
              <th className="th">Tool</th>
              <th className="th">Amount</th>
              <th className="th">Cycle</th>
              <th className="th">Next renewal</th>
              <th className="th">Status</th>
              <th className="th w-40"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {subs.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-10 text-center text-faint">
                  No subscriptions yet.
                </td>
              </tr>
            )}
            {subs.map((s) => {
              const overdue = s.active && s.nextPaymentDate.getTime() < now.getTime();
              return (
                <tr key={s.id} className="transition hover:bg-panel/50">
                  <td className="td font-semibold text-ink">{s.name}</td>
                  <td className="td font-bold text-ink">{inr(s.amount)}</td>
                  <td className="td text-muted">
                    {s.cycle === "YEARLY" ? "Yearly" : "Monthly"}
                  </td>
                  <td className="td text-muted">
                    {s.nextPaymentDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        !s.active
                          ? "bg-panel text-muted ring-line"
                          : overdue
                            ? "bg-bad-soft text-bad ring-bad-line"
                            : "bg-ok-soft text-ok ring-ok-line"
                      }`}
                    >
                      {!s.active ? "Paused" : overdue ? "Due" : "Active"}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleSubscription}>
                        <input type="hidden" name="subscriptionId" value={s.id} />
                        <button className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-panel">
                          {s.active ? "Pause" : "Resume"}
                        </button>
                      </form>
                      <form action={deleteSubscription}>
                        <input type="hidden" name="subscriptionId" value={s.id} />
                        <button className="text-xs font-semibold text-faint transition hover:text-rose-500">
                          Del
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
