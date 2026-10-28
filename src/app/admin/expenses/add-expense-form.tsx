"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { addExpense, type FinState } from "@/app/actions/finance";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const initial: FinState = {};

export default function AddExpenseForm({ staff }: { staff: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addExpense, initial);
  useActionToast(state);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <h2 className="text-sm font-bold text-ink">Log an expense</h2>
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-sm text-muted">Category</label>
          <select name="category" required className="input" defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Amount (₹)</label>
          <input name="amount" type="number" min="1" step="1" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Date</label>
          <input name="date" type="date" required defaultValue={today} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Staff member (optional)</label>
          <select name="staffId" className="input" defaultValue="">
            <option value="">—</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Note (optional)</label>
          <input name="note" className="input" placeholder="Invoice #, vendor…" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Log expense"}
      </button>
    </form>
  );
}
