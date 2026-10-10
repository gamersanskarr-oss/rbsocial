import Link from "next/link";
import {
  ensureMonthlyCharges,
  listClients,
  listPaymentsWithClient,
  monthKeyOf,
  paymentStatus,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { deletePayment, logFollowUp, markPaymentReceived } from "@/app/actions/finance";
import { PageHeader } from "@/components/ui";
import RecordPaymentForm from "./record-payment-form";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (key: string | null) => {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: "Received", cls: "bg-ok-soft text-ok ring-ok-line" },
  OVERDUE: { label: "Overdue", cls: "bg-bad-soft text-bad ring-bad-line" },
  DUE_TODAY: { label: "Due today", cls: "bg-warn-soft text-warn ring-warn-line" },
  PENDING: { label: "Pending", cls: "bg-panel text-muted ring-line" },
};

export default async function PaymentsPage() {
  await requireAdminOrAccountant();
  await ensureMonthlyCharges();
  const [clients, payments] = await Promise.all([listClients(), listPaymentsWithClient()]);

  const thisMonth = payments
    .filter((p) => p.receivedAt && monthKeyOf(p.receivedAt) === monthKeyOf(new Date()))
    .reduce((s, p) => s + p.amount, 0);
  const allTime = payments
    .filter((p) => p.receivedAt)
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = payments
    .filter((p) => paymentStatus(p) !== "RECEIVED")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        subtitle="Client collections — retainer cycles, dues and receipts."
      />

      <RecordPaymentForm
        clients={clients
          .filter((c) => c.status !== "ARCHIVED")
          .map((c) => ({ id: c.id, name: c.name, monthlyFee: c.monthlyFee }))}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">All payments</h2>
          <div className="flex gap-4 text-xs font-semibold text-muted">
            <span>This month received: <span className="text-ok">{inr(thisMonth)}</span></span>
            <span>Outstanding: <span className="text-bad">{inr(outstanding)}</span></span>
            <span>All time: <span className="text-ink">{inr(allTime)}</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Client</th>
                <th className="th">Month</th>
                <th className="th">Due date</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th">Received</th>
                <th className="th">Method</th>
                <th className="th">Follow-ups</th>
                <th className="th">Note</th>
                <th className="th w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={10} className="td py-10 text-center text-faint">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => {
                const st = paymentStatus(p);
                const style = STATUS_STYLE[st];
                return (
                  <tr key={p.id} className="transition hover:bg-panel/50">
                    <td className="td">
                      <Link href={`/admin/clients/${p.client.id}`} className="link font-semibold text-ink">
                        {p.client.name}
                      </Link>
                    </td>
                    <td className="td text-muted">{monthLabel(p.forMonth)}</td>
                    <td className="td text-muted">
                      {p.dueDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "—"}
                    </td>
                    <td className="td font-bold text-ink">{inr(p.amount)}</td>
                    <td className="td">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.cls}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="td text-muted">
                      {p.receivedAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "—"}
                    </td>
                    <td className="td text-muted">{p.method ?? "—"}</td>
                    <td className="td text-muted" title={p.lastContactedAt ? `Last: ${p.lastContactedAt.toLocaleDateString("en-IN")}` : ""}>
                      {p.followUps}
                    </td>
                    <td className="td max-w-40 truncate text-muted" title={p.note ?? ""}>
                      {p.note ?? "—"}
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1.5">
                        {st !== "RECEIVED" ? (
                          <>
                            <form action={logFollowUp}>
                              <input type="hidden" name="paymentId" value={p.id} />
                              <button className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-panel">
                                + Follow-up
                              </button>
                            </form>
                            <form action={markPaymentReceived}>
                              <input type="hidden" name="paymentId" value={p.id} />
                              <input type="hidden" name="method" value="ONLINE" />
                              <button className="rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold text-canvas shadow-sm transition hover:bg-accent-hover">
                                Received
                              </button>
                            </form>
                          </>
                        ) : (
                          <Link
                            href={`/admin/payments/${p.id}`}
                            className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-panel"
                          >
                            Invoice
                          </Link>
                        )}
                        <form action={deletePayment}>
                          <input type="hidden" name="paymentId" value={p.id} />
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
    </div>
  );
}
