"use client";

import { useActionState } from "react";
import { addSubscription, type FinState } from "@/app/actions/finance";

const initial: FinState = {};

export default function AddSubscriptionForm() {
  const [state, formAction, pending] = useActionState(addSubscription, initial);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <h2 className="text-sm font-bold text-ink">Add a subscription</h2>
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm text-muted">Tool name</label>
          <input name="name" required className="input" placeholder="Canva Pro" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Amount (₹)</label>
          <input name="amount" type="number" min="1" step="1" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Cycle</label>
          <select name="cycle" className="input" defaultValue="MONTHLY">
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Next payment</label>
          <input name="nextPaymentDate" type="date" required defaultValue={today} className="input" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Add subscription"}
      </button>
    </form>
  );
}
