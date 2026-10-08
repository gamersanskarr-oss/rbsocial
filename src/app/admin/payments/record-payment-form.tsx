"use client";

import { useActionState, useState } from "react";
import { recordPayment, type FinState } from "@/app/actions/finance";

const initial: FinState = {};

export default function RecordPaymentForm({
  clients,
}: {
  clients: { id: string; name: string; monthlyFee: number | null }[];
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initial);
  const [clientId, setClientId] = useState("");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const fee = clients.find((c) => c.id === clientId)?.monthlyFee;

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <h2 className="text-sm font-bold text-ink">Record a payment</h2>
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Client</label>
          <select
            name="clientId"
            required
            className="input"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="" disabled>
              Select client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Amount (₹)</label>
          <input
            name="amount"
            type="number"
            min="1"
            step="1"
            required
            className="input"
            placeholder={fee ? String(fee) : "5000"}
            key={fee ?? "x"}
            defaultValue={fee ?? ""}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Billing month</label>
          <input name="forMonth" type="month" required defaultValue={thisMonth} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Due date</label>
          <input name="dueDate" type="date" className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Payment method</label>
          <select name="method" className="input" defaultValue="ONLINE">
            <option value="ONLINE">Online (bank / UPI)</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Note (optional)</label>
          <input name="note" className="input" placeholder="UPI / invoice # / ref" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="received" className="h-4 w-4 rounded border-line" />
            Already received
          </label>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
    </form>
  );
}
