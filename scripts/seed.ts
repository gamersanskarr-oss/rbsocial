import "dotenv/config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

async function authUid(email: string, password: string, name: string): Promise<string> {
  try {
    return (await adminAuth.createUser({ email, password, displayName: name })).uid;
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "auth/email-already-exists") {
      return (await adminAuth.getUserByEmail(email)).uid;
    }
    throw e;
  }
}

async function addUser(
  name: string,
  email: string,
  password: string,
  role: string,
  team: string | null = null,
  missedDeadlines = 0
) {
  const uid = await authUid(email, password, name);
  await adminDb.collection("users").doc(uid).set({
    name,
    email,
    role,
    team,
    missedDeadlines,
    perPostPay: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return uid;
}

async function main() {
  const existing = await adminDb.collection("users").limit(1).get();
  if (!existing.empty) {
    console.log("Firestore already has data — aborting seed.");
    return;
  }

  const admin = await addUser("Admin", "admin@pixeldesk.com", "admin123", "ADMIN");
  const priya = await addUser("Priya Sharma", "priya@pixeldesk.com", "user123", "EMPLOYEE", "DESIGN", 2);
  const rahul = await addUser("Rahul Verma", "rahul@pixeldesk.com", "user123", "EMPLOYEE", "DESIGN");
  const arjun = await addUser("Arjun Mehta", "arjun@pixeldesk.com", "user123", "EMPLOYEE", "IT");
  await addUser("Sneha Kapoor", "manager@pixeldesk.com", "manager123", "MANAGER");
  await addUser("Kavya Rao", "accountant@pixeldesk.com", "accounts123", "ACCOUNTANT");

  const addClient = async (name: string, data: Record<string, unknown>) =>
    (
      await adminDb.collection("clients").add({
        name,
        contact: null,
        phone: null,
        instagram: null,
        facebook: null,
        website: null,
        logoUrl: null,
        notes: null,
        assignedToId: null,
        status: "ACTIVE",
        billingDay: null,
        billingModel: "PREPAID",
        monthlyFee: null,
        feeEffectiveFrom: null,
        previousMonthlyFee: null,
        createdAt: FieldValue.serverTimestamp(),
        ...data,
      })
    ).id;

  const acme = await addClient("Acme Cafe", {
    contact: "hello@acmecafe.com",
    assignedToId: priya,
    monthlyFee: 25000,
    billingDay: 5,
    billingModel: "PREPAID",
    feeEffectiveFrom: Timestamp.fromDate(new Date(now - 60 * day)),
  });
  const glow = await addClient("GlowUp Fitness", {
    contact: "+91 98765 43210",
    assignedToId: rahul,
    monthlyFee: 18000,
    billingDay: 10,
    billingModel: "MID_MONTH",
    feeEffectiveFrom: Timestamp.fromDate(new Date(now - 30 * day)),
  });
  const nova = await addClient("Nova Realty", {
    assignedToId: priya,
    monthlyFee: 40000,
    billingDay: 1,
    billingModel: "POSTPAID",
    feeEffectiveFrom: Timestamp.fromDate(new Date(now - 45 * day)),
  });

  // finance settings
  await adminDb.collection("settings").doc("finance").set({
    monthlyRevenueTarget: 100000,
    dharamPercent: 5,
  });

  // sample payments (two-date model)
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = new Date(now);
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
  const addPayment = (clientId: string, amount: number, data: Record<string, unknown>) =>
    adminDb.collection("clientPayments").add({
      clientId,
      amount,
      forMonth: ym(thisMonth),
      dueDate: null,
      receivedAt: null,
      paidAt: null,
      method: null,
      note: null,
      followUps: 0,
      lastContactedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      ...data,
    });
  await addPayment(acme, 25000, {
    forMonth: ym(thisMonth),
    dueDate: Timestamp.fromDate(new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5)),
    receivedAt: Timestamp.fromDate(new Date(now - 2 * day)),
    method: "ONLINE",
    note: "Oct retainer — UPI",
  });
  await addPayment(glow, 18000, {
    forMonth: ym(thisMonth),
    dueDate: Timestamp.fromDate(new Date(now - 3 * day)),
    note: "Oct retainer",
    followUps: 1,
    lastContactedAt: Timestamp.fromDate(new Date(now - 1 * day)),
  });
  await addPayment(nova, 40000, {
    forMonth: ym(lastMonth),
    dueDate: Timestamp.fromDate(new Date(now - 8 * day)),
    receivedAt: Timestamp.fromDate(new Date(now - 35 * day)),
    method: "ONLINE",
    note: "Sep retainer — NEFT",
  });

  // sample expenses + subscription + disbursement
  const addExpense = (category: string, amount: number, data: Record<string, unknown>) =>
    adminDb.collection("expenses").add({
      category,
      amount,
      date: Timestamp.fromDate(new Date(now - 4 * day)),
      note: null,
      staffId: null,
      subscriptionId: null,
      createdAt: FieldValue.serverTimestamp(),
      ...data,
    });
  await addExpense("Staff Payment", 12000, { note: "Oct payout advance", staffId: priya });
  await addExpense("Software", 2500, { note: "Figma team plan" });
  await addExpense("Office", 3000, { note: "Broadband", date: Timestamp.fromDate(new Date(now - 12 * day)) });

  await adminDb.collection("subscriptions").add({
    name: "Canva Pro",
    amount: 1100,
    cycle: "MONTHLY",
    nextPaymentDate: Timestamp.fromDate(new Date(now + 15 * day)),
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection("dharamDisbursements").add({
    recipient: "Local education trust",
    cause: "School supplies",
    amount: 1500,
    date: Timestamp.fromDate(new Date(now - 20 * day)),
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection("activityLog").add({
    type: "seed",
    message: "Workspace seeded with demo data.",
    createdAt: FieldValue.serverTimestamp(),
  });

  const tasks = [
    {
      topic: "Diwali sale Instagram post",
      description:
        "Festive sale announcement post for Acme Cafe. Square 1080x1080, brand colors are orange/cream. Include 20% off badge.",
      clientId: acme,
      assignedToId: priya,
      deadline: new Date(now + 3 * day),
      status: "PENDING",
      referenceLink: "https://www.canva.com/design/brand-kit-acme",
      submissionLink: null,
      completedAt: null,
    },
    {
      topic: "Weekend offer story",
      description: "Vertical 1080x1920 story for the weekend combo offer. Keep logo top-left.",
      clientId: acme,
      assignedToId: priya,
      deadline: new Date(now - 1 * day), // overdue -> becomes MISSED on first dashboard load
      status: "PENDING",
      referenceLink: null,
      submissionLink: null,
      completedAt: null,
    },
    {
      topic: "New trainer introduction post",
      description: "Carousel post introducing our new head trainer. Use photos from shared drive.",
      clientId: glow,
      assignedToId: rahul,
      deadline: new Date(now + 5 * day),
      status: "PENDING",
      referenceLink: null,
      submissionLink: null,
      completedAt: null,
    },
    {
      topic: "Gym membership reel cover",
      description: "Cover image for the January membership reel. Bold typography, dark theme.",
      clientId: glow,
      assignedToId: rahul,
      deadline: new Date(now - 2 * day),
      status: "COMPLETED",
      referenceLink: null,
      submissionLink: "https://www.canva.com/design/reel-cover-glowup",
      completedAt: Timestamp.fromDate(new Date(now - 2.5 * day)),
    },
    {
      topic: "Property listing flyer",
      description: "A4 flyer for the Nova Heights project listing. Include floor plan image.",
      clientId: nova,
      assignedToId: priya,
      deadline: new Date(now - 10 * day),
      status: "MISSED",
      referenceLink: null,
      submissionLink: null,
      completedAt: null,
    },
    {
      topic: "Website contact form fix",
      description: "Contact form on the Nova Realty landing page throws a 500 error. Investigate and fix.",
      clientId: nova,
      assignedToId: arjun,
      deadline: new Date(now + 2 * day),
      status: "PENDING",
      referenceLink: null,
      submissionLink: null,
      completedAt: null,
    },
  ];

  for (const t of tasks) {
    await adminDb.collection("tasks").add({
      ...t,
      deadline: Timestamp.fromDate(t.deadline),
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  console.log("Seeded. Admin:", admin);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
