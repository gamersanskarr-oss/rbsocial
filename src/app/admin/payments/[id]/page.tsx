import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb, getClient, type PaymentRecord } from "@/lib/data";
import { requireAdminOrAccountant } from "@/lib/auth";
import { Logo } from "@/components/logo";
import PrintButton from "./print-button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Indian numbering — amount in words for the invoice footer
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = (n: number) =>
  n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
const three = (n: number) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return (h ? ONES[h] + " Hundred" + (rest ? " " : "") : "") + (rest ? two(rest) : "");
};
function inWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return "Zero Rupees Only";
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  let s = "";
  if (crore) s += three(crore) + " Crore ";
  if (lakh) s += two(lakh) + " Lakh ";
  if (thousand) s += two(thousand) + " Thousand ";
  if (n) s += three(n);
  return s.trim() + " Rupees Only";
}

const periodLabel = (key: string | null) => {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const dateFmt = (d: Date | null) =>
  d?.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) ?? "—";

export default async function InvoicePage({
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
  const paid = !!p.receivedAt;

  const ym = p.receivedAt ?? p.createdAt ?? new Date();
  const invoiceNo = `RB-${String(ym.getFullYear()).slice(2)}${String(ym.getMonth() + 1).padStart(2, "0")}-${doc.id.slice(0, 6).toUpperCase()}`;
  const issueDate = p.receivedAt ?? new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:max-w-none print:space-y-0 print:bg-white print:p-12">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/payments" className="link text-sm">
          ← Back to payments
        </Link>
        <PrintButton />
      </div>

      <div className="card overflow-hidden print:border-0 print:shadow-none">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink px-8 py-7 print:px-0">
          <div className="flex items-center gap-4">
            <Logo size={64} rounded="rounded-2xl" />
            <div>
              <p className="text-xl font-bold tracking-tight text-ink">RB Social Branding</p>
              <p className="text-xs font-medium text-muted">
                Digital Marketing & Social Media Branding Agency
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Powered by ROSHAN BHARAT
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold uppercase tracking-[0.2em] text-ink">Invoice</p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">{invoiceNo}</p>
            {!paid && (
              <span className="mt-2 inline-block rounded-full bg-warn-soft px-3 py-1 text-xs font-bold text-warn ring-1 ring-inset ring-warn-line">
                PAYMENT DUE
              </span>
            )}
          </div>
        </div>

        {/* ── Bill to / invoice details ──────────────────────── */}
        <div className="grid gap-8 border-b border-line px-8 py-6 sm:grid-cols-2 print:px-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Bill to</p>
            <p className="mt-1.5 text-lg font-bold text-ink">{client?.name ?? "Client"}</p>
            <div className="mt-1 space-y-0.5 text-sm font-medium text-muted">
              {client?.contact && <p>{client.contact}</p>}
              {client?.phone && <p>{client.phone}</p>}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
              Invoice details
            </p>
            <table className="mt-1.5 text-sm">
              <tbody className="[&_td]:py-0.5">
                <tr>
                  <td className="pr-4 font-medium text-muted">Invoice date</td>
                  <td className="text-right font-semibold text-ink">{dateFmt(issueDate)}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-muted">Billing period</td>
                  <td className="text-right font-semibold text-ink">{periodLabel(p.forMonth)}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-muted">Due date</td>
                  <td className="text-right font-semibold text-ink">{dateFmt(p.dueDate)}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium text-muted">Payment method</td>
                  <td className="text-right font-semibold text-ink">
                    {p.method === "CASH" ? "Cash" : p.method === "ONLINE" ? "Online / UPI" : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Line items ─────────────────────────────────────── */}
        <div className="px-8 py-6 print:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink">
                <th className="py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                  #
                </th>
                <th className="py-2 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                  Description
                </th>
                <th className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-faint">
                  Qty
                </th>
                <th className="py-2 text-right text-[11px] font-bold uppercase tracking-wider text-faint">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-4 font-semibold text-muted">1</td>
                <td className="py-4">
                  <p className="font-semibold text-ink">
                    Social media branding retainer — {periodLabel(p.forMonth)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-faint">
                    Content design, posting & account management services
                  </p>
                </td>
                <td className="py-4 text-center font-medium text-muted">1</td>
                <td className="py-4 text-right font-bold text-ink">{inr(p.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Totals ───────────────────────────────────────── */}
          <div className="mt-6 flex flex-col items-end">
            <table className="w-full max-w-xs text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium text-muted">Subtotal</td>
                  <td className="py-1 text-right font-semibold text-ink">{inr(p.amount)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-muted">Tax (as applicable)</td>
                  <td className="py-1 text-right font-semibold text-ink">₹0.00</td>
                </tr>
                <tr className="border-t border-ink">
                  <td className="pt-2 font-bold text-ink">Total</td>
                  <td className="pt-2 text-right text-base font-bold text-ink">{inr(p.amount)}</td>
                </tr>
                {paid && (
                  <>
                    <tr>
                      <td className="py-1 font-medium text-ok">Amount received</td>
                      <td className="py-1 text-right font-semibold text-ok">
                        −{inr(p.amount)}
                      </td>
                    </tr>
                    <tr className="border-t border-line">
                      <td className="pt-2 font-bold text-ink">Balance due</td>
                      <td className="pt-2 text-right font-bold text-ok">₹0.00</td>
                    </tr>
                  </>
                )}
                {!paid && (
                  <tr className="border-t border-line">
                    <td className="pt-2 font-bold text-ink">Balance due</td>
                    <td className="pt-2 text-right font-bold text-bad">{inr(p.amount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {paid && (
              <span className="mt-3 rounded-full bg-ok-soft px-3 py-1 text-xs font-bold text-ok ring-1 ring-inset ring-ok-line">
                PAID IN FULL
              </span>
            )}
          </div>

          {/* ── Amount in words + reference ──────────────────── */}
          <div className="mt-8 grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Amount in words
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{inWords(p.amount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Reference / notes
              </p>
              <p className="mt-1 text-sm font-medium text-ink">{p.note ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="border-t border-line bg-panel/60 px-8 py-6 print:px-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-ink">Thank you for your business.</p>
              <p className="mt-0.5 text-xs font-medium text-faint">
                This is a computer-generated invoice from RB Social Branding.
              </p>
            </div>
            <div className="text-center">
              <p className="border-t border-ink/40 px-10 pt-1 text-xs font-semibold text-ink">
                Authorised Signatory
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-faint">RB Social Branding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
