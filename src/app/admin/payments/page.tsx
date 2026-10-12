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
import EditPaymentDialog from "./edit-payment-dialog";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// "YYYY-MM-DD" for <input type="date"> — local timezone, not UTC
const dateInput = (d: Date | null) =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "";

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

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    status?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireAdminOrAccountant();
  await ensureMonthlyCharges();
  const { client, status, month, from, to } = await searchParams;
  const [clients, payments] = await Promise.all([listClients(), listPaymentsWithClient()]);

  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59`) : null;
  const statusFilter =
    status === "RECEIVED" || status === "OVERDUE" || status === "DUE_TODAY" || status === "PENDING"
      ? status
      : "";

  // Date range applies to the row's effective date: receivedAt, else dueDate
  const filtered = payments.filter((p) => {
    if (client && p.client.id !== client) return false;
    if (statusFilter && paymentStatus(p) !== statusFilter) return false;
    if (month && p.forMonth !== month) return false;
    const eff = p.receivedAt ?? p.dueDate;
    if (fromDate && (!eff || eff < fromDate)) return false;
    if (toDate && (!eff || eff > toDate)) return false;
    return true;
  });

  const filteredReceived = filtered
    .filter((p) => p.receivedAt)
    .reduce((s, p) => s + p.amount, 0);
  const filteredOutstanding = filtered
    .filter((p) => paymentStatus(p) !== "RECEIVED")
    .reduce((s, p) => s + p.amount, 0);

  const thisMonth = payments
    .filter((p) => p.receivedAt && monthKeyOf(p.receivedAt) === monthKeyOf(new Date()))
    .reduce((s, p) => s + p.amount, 0);
  const allTime = payments
    .filter((p) => p.receivedAt)
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = payments
    .filter((p) => paymentStatus(p) !== "RECEIVED")
    .reduce((s, p) => s + p.amount, 0);

  const filtering = Boolean(client || statusFilter || month || from || to);

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

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Client</label>
            <select name="client" defaultValue={client ?? ""} className="input w-auto min-w-44 px-3 py-2 text-sm">
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Status</label>
            <select name="status" defaultValue={statusFilter} className="input w-auto px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_TODAY">Due today</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Billing month</label>
            <input type="month" name="month" defaultValue={month ?? ""} className="input w-auto px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">From</label>
            <input type="date" name="from" defaultValue={from ?? ""} className="input w-auto px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">To</label>
            <input type="date" name="to" defaultValue={to ?? ""} className="input w-auto px-3 py-2 text-sm" />
          </div>
          <button className="btn-primary px-4 py-2">Apply filters</button>
          <Link
            href="/admin/payments"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            Reset
          </Link>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel/70 px-5 py-4">
          <h2 className="text-sm font-bold text-ink">
            {filtering ? `Filtered payments (${filtered.length})` : "All payments"}
          </h2>
          {filtering ? (
            <div className="flex gap-4 text-xs font-semibold text-muted">
              <span>Received: <span className="text-ok">{inr(filteredReceived)}</span></span>
              <span>Outstanding: <span className="text-bad">{inr(filteredOutstanding)}</span></span>
            </div>
          ) : (
            <div className="flex gap-4 text-xs font-semibold text-muted">
              <span>This month received: <span className="text-ok">{inr(thisMonth)}</span></span>
              <span>Outstanding: <span className="text-bad">{inr(outstanding)}</span></span>
              <span>All time: <span className="text-ink">{inr(allTime)}</span></span>
            </div>
          )}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="td py-10 text-center text-faint">
                    {filtering ? "No payments match these filters." : "No payments recorded yet."}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
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
                        <EditPaymentDialog
                          payment={{
                            id: p.id,
                            clientName: p.client.name,
                            amount: p.amount,
                            forMonth: p.forMonth ?? "",
                            dueDate: dateInput(p.dueDate),
                            receivedAt: dateInput(p.receivedAt),
                            method: p.method ?? "",
                            note: p.note ?? "",
                          }}
                        />
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
