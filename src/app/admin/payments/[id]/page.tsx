import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb, getClient, type PaymentRecord } from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import PrintButton from "./print-button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminOrAccountant();
  const doc = await adminDb.collection("clientPayments").doc(id).get();
  if (!doc.exists) notFound();
  const d = doc.data()!;
  const p: PaymentRecord = {
    id: doc.id,
    clientId: String(d.clientId),
    amount: Number(d.amount),
    forMonth: d.forMonth ?? null,
    dueDate: d.dueDate?.toDate?.() ?? null,
    receivedAt: (d.receivedAt?.toDate?.() ?? d.paidAt?.toDate?.()) ?? null,
    method: d.method ?? null,
    note: d.note ?? null,
    followUps: d.followUps ?? 0,
    lastContactedAt: d.lastContactedAt?.toDate?.() ?? null,
    createdAt: d.createdAt?.toDate?.() ?? null,
  };
  const client = await getClient(p.clientId);
  const no = `RB-${doc.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/payments" className="link text-sm">
          ← Back to payments
        </Link>
        <PrintButton />
      </div>

      <div className="card overflow-hidden">
        <div className="bg-ink px-8 py-6 text-white">
          <p className="text-lg font-bold tracking-tight">RB Social Branding</p>
          <p className="mt-0.5 text-xs font-medium text-white/70">
            Payment receipt · powered by ROSHAN BHARAT
          </p>
        </div>
        <div className="space-y-5 px-8 py-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Receipt no.</p>
              <p className="font-mono text-sm font-bold text-ink">{no}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200/60">
              PAID
            </span>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Received from</p>
            <p className="mt-0.5 text-base font-bold text-ink">{client?.name ?? "Client"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Amount</p>
              <p className="mt-0.5 text-xl font-bold text-ink">{inr(p.amount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Received on</p>
              <p className="mt-0.5 font-semibold text-ink">
                {p.receivedAt?.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }) ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Method</p>
              <p className="mt-0.5 font-semibold text-ink">
                {p.method === "CASH" ? "Cash" : "Online / UPI"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Billing month
              </p>
              <p className="mt-0.5 font-semibold text-ink">
                {p.forMonth
                  ? new Date(
                      Number(p.forMonth.split("-")[0]),
                      Number(p.forMonth.split("-")[1]) - 1,
                      1
                    ).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {p.note && (
            <div className="border-t border-line pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Reference</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{p.note}</p>
            </div>
          )}

          <p className="border-t border-line pt-4 text-center text-xs font-medium text-faint">
            Thank you for your business — RB Social Branding
          </p>
        </div>
      </div>
    </div>
  );
}
