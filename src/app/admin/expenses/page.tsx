import {
  listEmployees,
  listExpenses,
  listSubscriptions,
  monthKeyOf,
  processSubscriptions,
} from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { deleteExpense, deleteSubscription, toggleSubscription } from "@/app/actions/finance";
import { PageHeader } from "@/components/ui";
import AddExpenseForm from "./add-expense-form";
import AddSubscriptionForm from "./add-subscription-form";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminOrAccountant();
  await processSubscriptions();
  const [expenses, staff, subs] = await Promise.all([
    listExpenses(),
    listEmployees(),
    listSubscriptions(),
  ]);

  const sp = await searchParams;
  const catFilter = typeof sp.cat === "string" ? sp.cat : "";
  const filtered = catFilter ? expenses.filter((e) => e.category === catFilter) : expenses;
  const allCats = [...new Set(expenses.map((e) => e.category))].sort();

  const key = monthKeyOf(new Date());
  const thisMonth = expenses.filter((e) => monthKeyOf(e.date) === key);
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of thisMonth) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const staffNames = new Map(staff.map((s) => [s.id, s.name]));

  const now = new Date();
  const active = subs.filter((s) => s.active);
  const monthlyCost = active.reduce(
    (s, x) => s + (x.cycle === "YEARLY" ? Math.round(x.amount / 12) : x.amount),
    0
  );

  const catHref = (c: string) =>
    c === catFilter ? "/admin/expenses" : `/admin/expenses?cat=${encodeURIComponent(c)}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expenses"
        subtitle="All spending in one place — one-time costs and recurring subscriptions."
      />

      <AddExpenseForm staff={staff.map((s) => ({ id: s.id, name: s.name }))} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">
              All expenses
              {catFilter && <span className="ml-2 font-medium text-muted">· {catFilter}</span>}
            </h2>
            <span className="text-xs font-semibold text-muted">
              This month: <span className="text-ink">{inr(monthTotal)}</span>
            </span>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            <a
              href="/admin/expenses"
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                !catFilter
                  ? "bg-ink text-canvas ring-ink"
                  : "bg-panel text-muted ring-line hover:text-ink"
              }`}
            >
              All
            </a>
            {allCats.map((c) => (
              <a
                key={c}
                href={catHref(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                  catFilter === c
                    ? "bg-ink text-canvas ring-ink"
                    : "bg-panel text-muted ring-line hover:text-ink"
                }`}
              >
                {c}
              </a>
            ))}
          </div>

          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Date</th>
                <th className="th">Category</th>
                <th className="th">Details</th>
                <th className="th">Amount</th>
                <th className="th w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-10 text-center text-faint">
                    {catFilter ? `No expenses in "${catFilter}".` : "No expenses logged yet."}
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="transition hover:bg-panel/50">
                  <td className="td text-muted">
                    {e.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="td">
                    <a
                      href={catHref(e.category)}
                      className="rounded-full bg-panel px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line transition hover:bg-hover"
                    >
                      {e.category}
                    </a>
                  </td>
                  <td className="td text-muted">
                    {e.staffId ? `${staffNames.get(e.staffId) ?? "Staff"} · ` : ""}
                    {e.note ?? "—"}
                  </td>
                  <td className="td font-bold text-ink">{inr(e.amount)}</td>
                  <td className="td">
                    <form action={deleteExpense}>
                      <input type="hidden" name="expenseId" value={e.id} />
                      <button className="text-xs font-semibold text-faint transition hover:text-rose-500">
                        Del
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden self-start">
          <div className="border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">This month by category</h2>
          </div>
          <ul className="divide-y divide-line">
            {[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <li key={cat} className="flex items-center justify-between px-5 py-3">
                  <a href={catHref(cat)} className="text-sm font-medium text-ink hover:underline">
                    {cat}
                  </a>
                  <span className="text-sm font-bold text-ink">{inr(amt)}</span>
                </li>
              ))}
            {byCategory.size === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No expenses this month.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Subscriptions — renewals auto-log as expenses */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Subscriptions</h2>
          <span className="text-xs font-semibold text-muted">
            ≈ {inr(monthlyCost)}/month recurring — renewals auto-log as expenses
          </span>
        </div>

        <AddSubscriptionForm />

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
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
      </section>
    </div>
  );
}
