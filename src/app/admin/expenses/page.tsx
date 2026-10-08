import { listEmployees, listExpenses, monthKeyOf, processSubscriptions } from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { deleteExpense } from "@/app/actions/finance";
import { PageHeader } from "@/components/ui";
import AddExpenseForm from "./add-expense-form";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function ExpensesPage() {
  await requireAdminOrAccountant();
  await processSubscriptions();
  const [expenses, staff] = await Promise.all([listExpenses(), listEmployees()]);

  const key = monthKeyOf(new Date());
  const thisMonth = expenses.filter((e) => monthKeyOf(e.date) === key);
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of thisMonth) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const staffNames = new Map(staff.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-8">
      <PageHeader title="Expenses" subtitle="Operations spend — staff, software, office and more." />

      <AddExpenseForm
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-panel/70 px-5 py-4">
            <h2 className="text-sm font-bold text-ink">All expenses</h2>
            <span className="text-xs font-semibold text-muted">
              This month: <span className="text-ink">{inr(monthTotal)}</span>
            </span>
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
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-10 text-center text-faint">
                    No expenses logged yet.
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="transition hover:bg-panel/50">
                  <td className="td text-muted">
                    {e.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="td">
                    <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line">
                      {e.category}
                    </span>
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
                  <span className="text-sm font-medium text-ink">{cat}</span>
                  <span className="text-sm font-bold text-ink">{inr(amt)}</span>
                </li>
              ))}
            {byCategory.size === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No expenses this month.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
