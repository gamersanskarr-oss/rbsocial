"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePayment, type FinState } from "@/app/actions/finance";

export type EditablePayment = {
  id: string;
  clientName: string;
  amount: number;
  forMonth: string; // "YYYY-MM" or ""
  dueDate: string; // "YYYY-MM-DD" or ""
  receivedAt: string; // "YYYY-MM-DD" or ""
  method: string; // "ONLINE" | "CASH" | ""
  note: string;
};

export default function EditPaymentDialog({ payment }: { payment: EditablePayment }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FinState, FormData>(updatePayment, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-panel"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">
                Edit payment — {payment.clientName}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-lg leading-none text-faint transition hover:text-ink"
              >
                ×
              </button>
            </div>

            {state.error && <p className="banner-error">{state.error}</p>}

            <form action={formAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="paymentId" value={payment.id} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Amount (₹)</label>
                <input name="amount" type="number" min="1" step="1" required defaultValue={payment.amount} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Billing month</label>
                <input name="forMonth" type="month" defaultValue={payment.forMonth} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Due date</label>
                <input name="dueDate" type="date" defaultValue={payment.dueDate} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Received on</label>
                <input name="receivedAt" type="date" defaultValue={payment.receivedAt} className="input" />
                <p className="mt-1 text-[10px] text-faint">Leave empty = unpaid</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Method</label>
                <select name="method" defaultValue={payment.method || "ONLINE"} className="input">
                  <option value="ONLINE">Online</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-faint">Note</label>
                <input name="note" defaultValue={payment.note} className="input" placeholder="UPI / invoice # / ref" />
              </div>

              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary px-5 py-2">
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
