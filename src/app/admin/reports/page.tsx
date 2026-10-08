import {
  listClients,
  listExpenses,
  listPaymentsWithClient,
  paymentStatus,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import ShareButton from "./share-button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const HORIZONS = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

function rangeStart(h: string, now = new Date()): Date | null {
  switch (h) {
    case "last-month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d;
    }
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ h?: string }>;
}) {
  await requireAdminOrAccountant();
  const { h = "this-month" } = await searchParams;
  const now = new Date();
  const start = rangeStart(h);
  const end =
    h === "last-month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : null;

  const [payments, expenses, clients] = await Promise.all([
    listPaymentsWithClient(),
    listExpenses(),
    listClients(),
  ]);

  const inRange = (d: Date | null) =>
    !!d && (!start || d >= start) && (!end || d < end);

  const rPayments = payments.filter((p) => inRange(p.receivedAt));
  const rExpenses = expenses.filter((e) => inRange(e.date));

  const received = rPayments.reduce((s, p) => s + p.amount, 0);
  const spent = rExpenses.reduce((s, e) => s + e.amount, 0);
  const net = received - spent;
  const margin = received > 0 ? Math.round((net / received) * 100) : 0;
  const outstanding = payments
    .filter((p) => paymentStatus(p) !== "RECEIVED")
    .reduce((s, p) => s + p.amount, 0);

  const byClient = new Map<string, number>();
  for (const p of rPayments) byClient.set(p.client.name, (byClient.get(p.client.name) ?? 0) + p.amount);
  const topClients = [...byClient.entries()].sort((a, b) => b[1] - a[1]);

  const byCategory = new Map<string, number>();
  for (const e of rExpenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const horizonLabel = HORIZONS.find((x) => x.key === h)?.label ?? "This month";

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" subtitle="Financial performance across any time horizon." />

      {/* Horizon filter + share */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <form method="GET" action="/admin/reports" className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-muted">Period</label>
          <select name="h" defaultValue={h} className="input w-auto px-3 py-2 text-sm">
            {HORIZONS.map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </select>
          <button className="btn-secondary px-4 py-2 text-sm">Apply</button>
        </form>
        <ShareButton horizon={h} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title={`Revenue (${horizonLabel.toLowerCase()})`} value={inr(received)} hint={`${rPayments.length} payments`} />
        <Card title="Expenses" value={inr(spent)} hint={`${rExpenses.length} entries`} />
        <Card title="Net profit" value={inr(net)} hint={`${margin}% margin`} />
        <Card title="Outstanding" value={inr(outstanding)} hint="unpaid dues, all time" />
        <Card title="Active clients" value={String(clients.filter((c) => c.status !== "ARCHIVED").length)} hint="on retainer" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Revenue by client</h2>
          </div>
          <ul className="divide-y divide-line">
            {topClients.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No revenue in this period.</li>
            )}
            {topClients.map(([name, amt]) => (
              <li key={name} className="px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{name}</span>
                  <span className="font-bold text-ink">
                    {inr(amt)}{" "}
                    <span className="font-medium text-faint">
                      · {received > 0 ? Math.round((amt / received) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: `${received > 0 ? Math.round((amt / received) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">Expenses by category</h2>
          </div>
          <ul className="divide-y divide-line">
            {topCategories.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No expenses in this period.</li>
            )}
            {topCategories.map(([cat, amt]) => (
              <li key={cat} className="px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{cat}</span>
                  <span className="font-bold text-ink">
                    {inr(amt)}{" "}
                    <span className="font-medium text-faint">
                      · {spent > 0 ? Math.round((amt / spent) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${spent > 0 ? Math.round((amt / spent) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
