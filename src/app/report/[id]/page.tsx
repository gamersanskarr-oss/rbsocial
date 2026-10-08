import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/data";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (key: string | null) => {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

type Snapshot = {
  generatedAt: string;
  horizon: string;
  settings: { monthlyRevenueTarget: number; dharamPercent: number };
  payments: {
    client: string;
    amount: number;
    forMonth: string | null;
    dueDate: string | null;
    receivedAt: string | null;
    method: string | null;
    note: string | null;
  }[];
  expenses: { category: string; amount: number; date: string; note: string | null }[];
  months: { month: string; received: number; expenses: number; net: number }[];
};

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await adminDb.collection("sharedReports").doc(id).get();
  if (!doc.exists) notFound();
  const snap = doc.data()!.snapshot as Snapshot;

  const received = snap.payments
    .filter((p) => p.receivedAt)
    .reduce((s, p) => s + p.amount, 0);
  const spent = snap.expenses.reduce((s, e) => s + e.amount, 0);
  const net = received - spent;
  const margin = received > 0 ? Math.round((net / received) * 100) : 0;

  return (
    <main className="min-h-screen bg-panel py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-faint">
            RB Social Branding
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Financial report</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Period: {snap.horizon.replace("-", " ")} · Generated{" "}
            {day(snap.generatedAt)} · Read-only
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-ink">{inr(received)}</p>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Expenses</p>
            <p className="mt-1 text-2xl font-bold text-ink">{inr(spent)}</p>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Net profit</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {inr(net)} <span className="text-sm font-medium text-faint">· {margin}%</span>
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Monthly performance</h2>
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
              {snap.months.map((m) => (
                <tr key={m.month}>
                  <td className="td font-semibold text-ink">{monthLabel(m.month)}</td>
                  <td className="td text-emerald-700">{inr(m.received)}</td>
                  <td className="td text-rose-600">{inr(m.expenses)}</td>
                  <td className={`td font-bold ${m.net >= 0 ? "text-ink" : "text-rose-600"}`}>
                    {inr(m.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Payments</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Client</th>
                <th className="th">Month</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {snap.payments.map((p, i) => (
                <tr key={i}>
                  <td className="td font-semibold text-ink">{p.client}</td>
                  <td className="td text-muted">{monthLabel(p.forMonth)}</td>
                  <td className="td font-bold text-ink">{inr(p.amount)}</td>
                  <td className="td">
                    {p.receivedAt ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/60">
                        Received {day(p.receivedAt)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/60">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs font-medium text-faint">
          This is a view-only snapshot shared by RB Social Branding ·{" "}
          <Link href="/" className="link">rbsocial</Link>
        </p>
      </div>
    </main>
  );
}
