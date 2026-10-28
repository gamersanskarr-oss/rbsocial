"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { addDisbursement, type FinState } from "@/app/actions/finance";

const initial: FinState = {};

export default function AddDisbursementForm({ balance }: { balance: number }) {
  const [state, formAction, pending] = useActionState(addDisbursement, initial);
  useActionToast(state);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <h2 className="text-sm font-bold text-ink">
        Record a contribution{" "}
        <span className="font-medium text-faint">
          · available ₹{balance.toLocaleString("en-IN")}
        </span>
      </h2>
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Recipient</label>
          <input name="recipient" required className="input" placeholder="Organisation / person" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Cause (optional)</label>
          <input name="cause" className="input" placeholder="Education, medical…" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Amount (₹)</label>
          <input name="amount" type="number" min="1" step="1" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Date</label>
          <input name="date" type="date" required defaultValue={today} className="input" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Record contribution"}
      </button>
    </form>
  );
}
