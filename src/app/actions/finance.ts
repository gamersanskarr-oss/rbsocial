"use server";

import { revalidatePath } from "next/cache";
import {
  adminDb,
  FieldValue,
  Timestamp,
  getClient,
  getFinanceSettings,
  listClients,
  listExpenses,
  listPayments,
  logActivity,
  monthKeyOf,
  bucketByMonth,
} from "@/lib/data";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { requireAdmin, requireAdminOrAccountant } from "@/lib/auth";

export type FinState = { error?: string; success?: string; shareUrl?: string };

const FIN_PATHS = [
  "/admin/payments",
  "/admin/expenses",
  "/admin/subscriptions",
  "/admin/dharam",
  "/admin/reports",
];
const revalidateFinance = () => FIN_PATHS.forEach((p) => revalidatePath(p));

const parseAmount = (raw: string) => {
  const n = Number(raw);
  return raw === "" || isNaN(n) || n <= 0 ? null : n;
};
const parseDate = (raw: string) => {
  const d = raw ? new Date(raw) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

// ---------------------------------------------------------------------------
// Client billing
// ---------------------------------------------------------------------------

export async function updateClientBilling(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;
  const client = await getClient(clientId);
  if (!client) return;

  const billingDay = Number(formData.get("billingDay")) || null;
  const billingModel = String(formData.get("billingModel") ?? "") || null;
  const monthlyFee = parseAmount(String(formData.get("monthlyFee") ?? "").trim());
  const status = String(formData.get("status") ?? "ACTIVE") === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";

  const feeChanged = monthlyFee !== client.monthlyFee;
  await adminDb
    .collection("clients")
    .doc(clientId)
    .update({
      billingDay,
      billingModel,
      status,
      monthlyFee,
      ...(feeChanged
        ? { previousMonthlyFee: client.monthlyFee ?? null, feeEffectiveFrom: Timestamp.now() }
        : {}),
    });
  if (feeChanged && monthlyFee != null) {
    await logActivity("billing", `${client.name} monthly fee set to ₹${monthlyFee.toLocaleString("en-IN")}.`);
  }
  revalidateFinance();
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordPayment(_prev: FinState, formData: FormData): Promise<FinState> {
  await requireAdminOrAccountant();
  const clientId = String(formData.get("clientId") ?? "");
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());
  const forMonth = String(formData.get("forMonth") ?? "").trim() || monthKeyOf(new Date());
  const dueDate = parseDate(String(formData.get("dueDate") ?? "").trim());
  const method = String(formData.get("method") ?? "") || null;
  const received = formData.get("received") === "on";
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!clientId || amount == null) return { error: "Client and a valid amount are required." };
  if (!/^\d{4}-\d{2}$/.test(forMonth)) return { error: "Invalid billing month." };

  const client = await getClient(clientId);
  if (!client) return { error: "Client not found." };

  await adminDb.collection("clientPayments").add({
    clientId,
    amount,
    forMonth,
    dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
    receivedAt: received ? Timestamp.now() : null,
    paidAt: null,
    method,
    note,
    followUps: 0,
    lastContactedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity(
    "payment",
    received
      ? `Received ₹${amount.toLocaleString("en-IN")} from ${client.name}.`
      : `Payment of ₹${amount.toLocaleString("en-IN")} expected from ${client.name}.`
  );
  revalidateFinance();
  return { success: `Payment of ₹${amount.toLocaleString("en-IN")} recorded.` };
}

export async function markPaymentReceived(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("paymentId") ?? "");
  const method = String(formData.get("method") ?? "") || null;
  if (!id) return;
  const doc = await adminDb.collection("clientPayments").doc(id).get();
  if (!doc.exists) return;
  const p = doc.data()!;
  await doc.ref.update({
    receivedAt: Timestamp.now(),
    ...(method ? { method } : {}),
  });
  const client = await getClient(String(p.clientId));
  await logActivity(
    "payment",
    `Received ₹${Number(p.amount).toLocaleString("en-IN")} from ${client?.name ?? "client"}${method === "CASH" ? " (cash)" : ""}.`
  );
  revalidateFinance();
}

export async function logFollowUp(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("paymentId") ?? "");
  if (!id) return;
  await adminDb
    .collection("clientPayments")
    .doc(id)
    .update({ followUps: FieldValue.increment(1), lastContactedAt: Timestamp.now() });
  await logActivity("followup", "Follow-up logged on a pending payment.");
  revalidateFinance();
}

export async function deletePayment(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("paymentId") ?? "");
  if (id) await adminDb.collection("clientPayments").doc(id).delete().catch(() => null);
  revalidateFinance();
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function addExpense(_prev: FinState, formData: FormData): Promise<FinState> {
  await requireAdminOrAccountant();
  const category = String(formData.get("category") ?? "");
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());
  const date = parseDate(String(formData.get("date") ?? "").trim()) ?? new Date();
  const staffId = String(formData.get("staffId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!EXPENSE_CATEGORIES.includes(category) || amount == null) {
    return { error: "Category and a valid amount are required." };
  }
  await adminDb.collection("expenses").add({
    category,
    amount,
    date: Timestamp.fromDate(date),
    note,
    staffId,
    subscriptionId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity("expense", `Expense ₹${amount.toLocaleString("en-IN")} · ${category}.`);
  revalidateFinance();
  return { success: `Expense of ₹${amount.toLocaleString("en-IN")} logged.` };
}

export async function deleteExpense(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("expenseId") ?? "");
  if (id) await adminDb.collection("expenses").doc(id).delete().catch(() => null);
  revalidateFinance();
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export async function addSubscription(_prev: FinState, formData: FormData): Promise<FinState> {
  await requireAdminOrAccountant();
  const name = String(formData.get("name") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());
  const cycle = String(formData.get("cycle") ?? "MONTHLY") === "YEARLY" ? "YEARLY" : "MONTHLY";
  const nextPaymentDate = parseDate(String(formData.get("nextPaymentDate") ?? "").trim());

  if (!name || amount == null || !nextPaymentDate) {
    return { error: "Name, amount and next payment date are required." };
  }
  await adminDb.collection("subscriptions").add({
    name,
    amount,
    cycle,
    nextPaymentDate: Timestamp.fromDate(nextPaymentDate),
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity("subscription", `Subscription added: ${name} (₹${amount.toLocaleString("en-IN")}/${cycle === "YEARLY" ? "yr" : "mo"}).`);
  revalidateFinance();
  return { success: `Subscription "${name}" added.` };
}

export async function toggleSubscription(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("subscriptionId") ?? "");
  if (!id) return;
  const doc = await adminDb.collection("subscriptions").doc(id).get();
  if (doc.exists) await doc.ref.update({ active: !(doc.data()?.active ?? true) });
  revalidateFinance();
}

export async function deleteSubscription(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("subscriptionId") ?? "");
  if (id) await adminDb.collection("subscriptions").doc(id).delete().catch(() => null);
  revalidateFinance();
}

// ---------------------------------------------------------------------------
// Dharam disbursements
// ---------------------------------------------------------------------------

export async function addDisbursement(_prev: FinState, formData: FormData): Promise<FinState> {
  await requireAdminOrAccountant();
  const recipient = String(formData.get("recipient") ?? "").trim();
  const cause = String(formData.get("cause") ?? "").trim() || null;
  const amount = parseAmount(String(formData.get("amount") ?? "").trim());
  const date = parseDate(String(formData.get("date") ?? "").trim()) ?? new Date();

  if (!recipient || amount == null) return { error: "Recipient and a valid amount are required." };
  await adminDb.collection("dharamDisbursements").add({
    recipient,
    cause,
    amount,
    date: Timestamp.fromDate(date),
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity("dharam", `Dharam contribution ₹${amount.toLocaleString("en-IN")} to ${recipient}.`);
  revalidateFinance();
  return { success: `Contribution of ₹${amount.toLocaleString("en-IN")} recorded.` };
}

export async function deleteDisbursement(formData: FormData) {
  await requireAdminOrAccountant();
  const id = String(formData.get("disbursementId") ?? "");
  if (id) await adminDb.collection("dharamDisbursements").doc(id).delete().catch(() => null);
  revalidateFinance();
}

// ---------------------------------------------------------------------------
// Finance settings (owner only)
// ---------------------------------------------------------------------------

export async function updateFinanceSettings(formData: FormData) {
  await requireAdmin();
  const target = Number(String(formData.get("monthlyRevenueTarget") ?? "").trim());
  const dharamPercent = Number(String(formData.get("dharamPercent") ?? "").trim());
  await adminDb.collection("settings").doc("finance").set(
    {
      monthlyRevenueTarget: isNaN(target) || target < 0 ? 0 : target,
      dharamPercent: isNaN(dharamPercent) || dharamPercent < 0 ? 0 : dharamPercent,
    },
    { merge: true }
  );
  revalidateFinance();
}

// ---------------------------------------------------------------------------
// Shareable report links
// ---------------------------------------------------------------------------

export async function createShareLink(
  _prev: FinState,
  formData: FormData
): Promise<FinState> {
  await requireAdminOrAccountant();
  const horizon = String(formData.get("horizon") ?? "this-month");

  const [payments, expenses, settings, clients] = await Promise.all([
    listPayments(),
    listExpenses(),
    getFinanceSettings(),
    listClients(),
  ]);
  const clientNames = new Map(clients.map((c) => [c.id, c.name]));
  const buckets = bucketByMonth(payments, expenses);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    horizon,
    settings,
    payments: payments.map((p) => ({
      client: clientNames.get(p.clientId) ?? "Client",
      amount: p.amount,
      forMonth: p.forMonth,
      dueDate: p.dueDate?.toISOString() ?? null,
      receivedAt: p.receivedAt?.toISOString() ?? null,
      method: p.method,
      note: p.note,
    })),
    expenses: expenses.map((e) => ({
      category: e.category,
      amount: e.amount,
      date: e.date.toISOString(),
      note: e.note,
    })),
    months: [...buckets.values()].sort((a, b) => b.month.localeCompare(a.month)),
  };

  const ref = await adminDb.collection("sharedReports").add({
    snapshot,
    createdAt: FieldValue.serverTimestamp(),
  });
  await logActivity("report", `A shareable ${horizon} report link was generated.`);
  return { success: "Share link created.", shareUrl: `/report/${ref.id}` };
}
