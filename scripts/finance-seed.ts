import "dotenv/config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

async function main() {
  // 1. accountant user
  let accUid: string;
  try {
    accUid = (await adminAuth.createUser({
      email: "accountant@pixeldesk.com",
      password: "accounts123",
      displayName: "Kavya Rao",
    })).uid;
  } catch {
    accUid = (await adminAuth.getUserByEmail("accountant@pixeldesk.com")).uid;
  }
  await adminDb.collection("users").doc(accUid).set({
    name: "Kavya Rao",
    email: "accountant@pixeldesk.com",
    role: "ACCOUNTANT",
    team: null,
    missedDeadlines: 0,
    perPostPay: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("accountant ready:", accUid);

  // 2. billing fields on existing clients
  const fees: Record<string, [number, number, string]> = {
    "Acme Cafe": [25000, 5, "PREPAID"],
    "GlowUp Fitness": [18000, 10, "MID_MONTH"],
    "Nova Realty": [40000, 1, "POSTPAID"],
  };
  const clients = await adminDb.collection("clients").get();
  for (const doc of clients.docs) {
    const name = String(doc.data().name ?? "");
    const [fee, billingDay, model] = fees[name] ?? [15000, 5, "PREPAID"];
    await doc.ref.set(
      {
        status: "ACTIVE",
        monthlyFee: doc.data().monthlyFee ?? fee,
        billingDay: doc.data().billingDay ?? billingDay,
        billingModel: doc.data().billingModel ?? model,
        feeEffectiveFrom: Timestamp.fromDate(new Date(now - 30 * day)),
        previousMonthlyFee: null,
      },
      { merge: true }
    );
  }
  console.log("clients updated with billing fields");

  // 3. finance settings
  await adminDb.collection("settings").doc("finance").set(
    { monthlyRevenueTarget: 100000, dharamPercent: 5 },
    { merge: true }
  );

  // 4. sample finance data (only if collections are empty)
  const d = thisMonth();
  function thisMonth() {
    return new Date(now);
  }

  const clientIds = new Map(clients.docs.map((c) => [String(c.data().name), c.id]));
  const paySnap = await adminDb.collection("clientPayments").limit(1).get();
  if (paySnap.empty) {
    const cur = ym(d);
    const last = ym(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const add = (clientId: string, amount: number, extra: Record<string, unknown>) =>
      adminDb.collection("clientPayments").add({
        clientId,
        amount,
        forMonth: cur,
        dueDate: null,
        receivedAt: null,
        paidAt: null,
        method: null,
        note: null,
        followUps: 0,
        lastContactedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        ...extra,
      });
    await add(clientIds.get("Acme Cafe")!, 25000, {
      dueDate: Timestamp.fromDate(new Date(d.getFullYear(), d.getMonth(), 5)),
      receivedAt: Timestamp.fromDate(new Date(now - 2 * day)),
      method: "ONLINE",
      note: "Retainer — UPI",
    });
    await add(clientIds.get("GlowUp Fitness")!, 18000, {
      dueDate: Timestamp.fromDate(new Date(now - 3 * day)),
      note: "Retainer",
      followUps: 1,
      lastContactedAt: Timestamp.fromDate(new Date(now - 1 * day)),
    });
    await add(clientIds.get("Nova Realty")!, 40000, {
      forMonth: last,
      dueDate: Timestamp.fromDate(new Date(now - 8 * day)),
      receivedAt: Timestamp.fromDate(new Date(now - 35 * day)),
      method: "ONLINE",
      note: "Retainer — NEFT",
    });
    console.log("sample payments added");
  }

  const expSnap = await adminDb.collection("expenses").limit(1).get();
  if (expSnap.empty) {
    const priyaSnap = await adminDb.collection("users").where("email", "==", "priya@pixeldesk.com").limit(1).get();
    const priyaId = priyaSnap.empty ? null : priyaSnap.docs[0].id;
    const add = (category: string, amount: number, extra: Record<string, unknown>) =>
      adminDb.collection("expenses").add({
        category,
        amount,
        date: Timestamp.fromDate(new Date(now - 4 * day)),
        note: null,
        staffId: null,
        subscriptionId: null,
        createdAt: FieldValue.serverTimestamp(),
        ...extra,
      });
    await add("Staff Payment", 12000, { note: "Payout advance", staffId: priyaId });
    await add("Software", 2500, { note: "Figma team plan" });
    await add("Office", 3000, { note: "Broadband", date: Timestamp.fromDate(new Date(now - 12 * day)) });
    console.log("sample expenses added");
  }

  const subSnap = await adminDb.collection("subscriptions").limit(1).get();
  if (subSnap.empty) {
    await adminDb.collection("subscriptions").add({
      name: "Canva Pro",
      amount: 1100,
      cycle: "MONTHLY",
      nextPaymentDate: Timestamp.fromDate(new Date(now + 15 * day)),
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log("sample subscription added");
  }

  const dhSnap = await adminDb.collection("dharamDisbursements").limit(1).get();
  if (dhSnap.empty) {
    await adminDb.collection("dharamDisbursements").add({
      recipient: "Local education trust",
      cause: "School supplies",
      amount: 1500,
      date: Timestamp.fromDate(new Date(now - 20 * day)),
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await adminDb.collection("activityLog").add({
    type: "seed",
    message: "Finance module initialized with demo data.",
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
