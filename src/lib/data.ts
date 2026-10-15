import "server-only";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { DEFAULT_TASK_TYPES } from "./constants";

// ---------------------------------------------------------------------------
// Records (mirror the old Prisma models; timestamps are converted to Date)
// ---------------------------------------------------------------------------

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string; // ADMIN | EMPLOYEE | MANAGER
  team: string | null; // DESIGN | IT
  missedDeadlines: number;
  perPostPay: number | null;
  createdAt: Date | null;
};

export type ClientRecord = {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  logoUrl: string | null;
  notes: string | null;
  assignedToId: string | null;
  // finance / retainer billing
  status: string | null; // ACTIVE | ARCHIVED
  billingDay: number | null; // 1-31
  billingModel: string | null; // PREPAID | POST_WORK | MID_MONTH | POSTPAID
  monthlyFee: number | null;
  feeEffectiveFrom: Date | null;
  previousMonthlyFee: number | null;
  createdAt: Date | null;
};

export type AssetRecord = {
  id: string;
  clientId: string;
  name: string;
  url: string;
  createdAt: Date | null;
};

export type TaskRecord = {
  id: string;
  topic: string;
  description: string;
  clientId: string;
  assignedToId: string;
  deadline: Date;
  status: string; // PENDING | COMPLETED | MISSED
  type: string | null; // e.g. "Static Post" | "Carousel" | custom category
  slideCount: number | null; // e.g. 8 for a Carousel task
  payAmount: number | null; // per-task amount (falls back to assignee's perPostPay)
  referenceLink: string | null;
  submissionLink: string | null;
  completedAt: Date | null;
  createdAt: Date | null;
};

export type RequestRecord = {
  id: string;
  taskId: string;
  message: string;
  status: string; // OPEN | RESOLVED
  createdAt: Date | null;
  resolvedAt: Date | null;
};

export type PaymentRecord = {
  id: string;
  clientId: string;
  amount: number;
  // two-date model: forMonth = service month ("YYYY-MM"), receivedAt = settled date
  forMonth: string | null;
  dueDate: Date | null;
  receivedAt: Date | null;
  paidAt?: Date | null; // legacy field, mapped to receivedAt on read
  method: string | null; // ONLINE | CASH
  note: string | null;
  followUps: number;
  lastContactedAt: Date | null;
  createdAt: Date | null;
};

export type ExpenseRecord = {
  id: string;
  category: string;
  amount: number;
  date: Date;
  note: string | null;
  staffId: string | null;
  subscriptionId: string | null;
  createdAt: Date | null;
};

export type SubscriptionRecord = {
  id: string;
  name: string;
  amount: number;
  cycle: string; // MONTHLY | YEARLY
  nextPaymentDate: Date;
  active: boolean;
  createdAt: Date | null;
};

export type DisbursementRecord = {
  id: string;
  recipient: string;
  cause: string | null;
  amount: number;
  date: Date;
  createdAt: Date | null;
};

export type JobRecord = {
  id: string;
  title: string;
  team: string | null; // DESIGN | IT | MARKETING | OPS
  type: string; // FULL_TIME | PART_TIME | INTERNSHIP | CONTRACT
  location: string;
  salary: string | null; // e.g. "₹15,000–25,000/mo"
  description: string;
  applyLink: string | null; // mailto: or https URL — defaults to careers@ inbox
  active: boolean;
  createdAt: Date | null;
};

export type JobApplicationRecord = {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string | null;
  portfolio: string | null;
  message: string | null;
  status: "NEW" | "REVIEWED";
  createdAt: Date | null;
};

export type FinanceSettings = {
  monthlyRevenueTarget: number;
  dharamPercent: number;
};

export type ActivityRecord = {
  id: string;
  type: string;
  message: string;
  createdAt: Date | null;
};

export { adminDb, Timestamp, FieldValue };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function withDates<T>(doc: FirebaseFirestore.DocumentSnapshot, fields: string[]): T {
  const data = doc.data() ?? {};
  const out: Record<string, unknown> = { id: doc.id, ...data };
  for (const f of fields) out[f] = toDate(out[f]);
  return out as T;
}

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
const newest = (a: { createdAt: Date | null }, b: { createdAt: Date | null }) =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const USER_DATES = ["createdAt"];

export async function getUser(id: string): Promise<UserRecord | null> {
  const doc = await adminDb.collection("users").doc(id).get();
  return doc.exists ? withDates<UserRecord>(doc, USER_DATES) : null;
}

export async function listEmployees(): Promise<UserRecord[]> {
  const snap = await adminDb.collection("users").where("role", "==", "EMPLOYEE").get();
  return snap.docs.map((d) => withDates<UserRecord>(d, USER_DATES)).sort(byName);
}

export async function listAllUsers(): Promise<UserRecord[]> {
  const snap = await adminDb.collection("users").get();
  return snap.docs.map((d) => withDates<UserRecord>(d, USER_DATES)).sort(byName);
}

export async function listDesigners(): Promise<{ id: string; name: string }[]> {
  return (await listEmployees())
    .filter((u) => u.team === "DESIGN")
    .map((u) => ({ id: u.id, name: u.name }));
}

export async function listEmployeeOptions(): Promise<
  { id: string; name: string; team: string | null; perPostPay: number | null }[]
> {
  return (await listEmployees()).map((u) => ({
    id: u.id,
    name: u.name,
    team: u.team,
    perPostPay: u.perPostPay,
  }));
}

export async function userNameMap(): Promise<Map<string, string>> {
  const snap = await adminDb.collection("users").get();
  return new Map(snap.docs.map((d) => [d.id, String(d.data().name ?? "")]));
}

// ---------------------------------------------------------------------------
// Clients & assets
// ---------------------------------------------------------------------------

const CLIENT_DATES = ["createdAt", "feeEffectiveFrom"];

export async function listClients(): Promise<ClientRecord[]> {
  const snap = await adminDb.collection("clients").get();
  return snap.docs.map((d) => withDates<ClientRecord>(d, CLIENT_DATES)).sort(newest);
}

export async function listClientOptions(): Promise<{ id: string; name: string }[]> {
  return (await listClients()).sort(byName).map((c) => ({ id: c.id, name: c.name }));
}

export async function getClient(id: string): Promise<ClientRecord | null> {
  const doc = await adminDb.collection("clients").doc(id).get();
  return doc.exists ? withDates<ClientRecord>(doc, CLIENT_DATES) : null;
}

export async function listClientsByAssignee(userId: string): Promise<ClientRecord[]> {
  const snap = await adminDb.collection("clients").where("assignedToId", "==", userId).get();
  return snap.docs.map((d) => withDates<ClientRecord>(d, CLIENT_DATES)).sort(byName);
}

export async function listAssets(clientId: string): Promise<AssetRecord[]> {
  const snap = await adminDb.collection("clientAssets").where("clientId", "==", clientId).get();
  return snap.docs.map((d) => withDates<AssetRecord>(d, ["createdAt"])).sort(newest);
}

/** clientId -> number of tasks */
export async function taskCountsByClient(): Promise<Map<string, number>> {
  const snap = await adminDb.collection("tasks").get();
  const map = new Map<string, number>();
  for (const d of snap.docs) {
    const cid = String(d.data().clientId);
    map.set(cid, (map.get(cid) ?? 0) + 1);
  }
  return map;
}

/** clientId -> number of assets */
export async function assetCountsByClient(): Promise<Map<string, number>> {
  const snap = await adminDb.collection("clientAssets").get();
  const map = new Map<string, number>();
  for (const d of snap.docs) {
    const cid = String(d.data().clientId);
    map.set(cid, (map.get(cid) ?? 0) + 1);
  }
  return map;
}

/** userId -> number of assigned clients */
export async function clientCountsByAssignee(): Promise<Map<string, number>> {
  const snap = await adminDb.collection("clients").get();
  const map = new Map<string, number>();
  for (const d of snap.docs) {
    const uid = d.data().assignedToId;
    if (uid) map.set(String(uid), (map.get(String(uid)) ?? 0) + 1);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const TASK_DATES = ["deadline", "completedAt", "createdAt"];
const REQUEST_DATES = ["createdAt", "resolvedAt"];

type TaskWithRefs = TaskRecord & {
  client: { name: string };
  assignedTo: { name: string };
  requests: RequestRecord[]; // OPEN requests only
};

async function attachTaskRefs(tasks: TaskRecord[]): Promise<TaskWithRefs[]> {
  const [users, clients, reqSnap] = await Promise.all([
    userNameMap(),
    adminDb.collection("clients").get(),
    adminDb.collection("taskRequests").where("status", "==", "OPEN").get(),
  ]);
  const clientNames = new Map(
    clients.docs.map((d) => [d.id, String(d.data().name ?? "")])
  );
  const openByTask = new Map<string, RequestRecord[]>();
  for (const d of reqSnap.docs) {
    const r = withDates<RequestRecord>(d, REQUEST_DATES);
    openByTask.set(r.taskId, [...(openByTask.get(r.taskId) ?? []), r]);
  }
  return tasks.map((t) => ({
    ...t,
    client: { name: clientNames.get(t.clientId) ?? "" },
    assignedTo: { name: users.get(t.assignedToId) ?? "" },
    requests: openByTask.get(t.id) ?? [],
  }));
}

export async function listTasksWithRefs(): Promise<TaskWithRefs[]> {
  const snap = await adminDb.collection("tasks").get();
  const tasks = snap.docs.map((d) => withDates<TaskRecord>(d, TASK_DATES)).sort(newest);
  return attachTaskRefs(tasks);
}

export async function listTasksForUser(userId: string): Promise<TaskWithRefs[]> {
  const snap = await adminDb.collection("tasks").where("assignedToId", "==", userId).get();
  const tasks = snap.docs
    .map((d) => withDates<TaskRecord>(d, TASK_DATES))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return a.deadline.getTime() - b.deadline.getTime();
    });
  return attachTaskRefs(tasks);
}

export async function getTaskDetail(
  id: string
): Promise<(TaskRecord & { client: ClientRecord; requests: RequestRecord[] }) | null> {
  const doc = await adminDb.collection("tasks").doc(id).get();
  if (!doc.exists) return null;
  const task = withDates<TaskRecord>(doc, TASK_DATES);
  const [client, reqSnap] = await Promise.all([
    getClient(task.clientId),
    adminDb.collection("taskRequests").where("taskId", "==", id).get(),
  ]);
  if (!client) return null;
  const requests = reqSnap.docs
    .map((d) => withDates<RequestRecord>(d, REQUEST_DATES))
    .sort(newest);
  return { ...task, client, requests };
}

export async function tasksByClient(
  clientId: string
): Promise<(TaskRecord & { assignedTo: { name: string } })[]> {
  const snap = await adminDb.collection("tasks").where("clientId", "==", clientId).get();
  const tasks = snap.docs.map((d) => withDates<TaskRecord>(d, TASK_DATES)).sort(newest);
  const users = await userNameMap();
  return tasks.map((t) => ({ ...t, assignedTo: { name: users.get(t.assignedToId) ?? "" } }));
}

/** Completed tasks whose completedAt falls inside [start, end). */
export async function completedTasksBetween(start: Date, end: Date): Promise<TaskRecord[]> {
  const snap = await adminDb
    .collection("tasks")
    .where("completedAt", ">=", Timestamp.fromDate(start))
    .where("completedAt", "<", Timestamp.fromDate(end))
    .get();
  return snap.docs
    .map((d) => withDates<TaskRecord>(d, TASK_DATES))
    .filter((t) => t.status === "COMPLETED");
}

/** All tasks whose deadline falls inside [start, end), with client name attached. */
export async function tasksDueBetween(
  start: Date,
  end: Date
): Promise<(TaskRecord & { client: { name: string } })[]> {
  const snap = await adminDb
    .collection("tasks")
    .where("deadline", ">=", Timestamp.fromDate(start))
    .where("deadline", "<", Timestamp.fromDate(end))
    .get();
  const tasks = snap.docs.map((d) => withDates<TaskRecord>(d, TASK_DATES)).sort(newest);
  const clients = await adminDb.collection("clients").get();
  const names = new Map(clients.docs.map((c) => [c.id, String(c.data().name ?? "")]));
  return tasks.map((t) => ({ ...t, client: { name: names.get(t.clientId) ?? "" } }));
}

/** Missed tasks whose deadline falls inside [start, end). */
export async function missedTasksBetween(start: Date, end: Date): Promise<TaskRecord[]> {
  const snap = await adminDb
    .collection("tasks")
    .where("deadline", ">=", Timestamp.fromDate(start))
    .where("deadline", "<", Timestamp.fromDate(end))
    .get();
  return snap.docs
    .map((d) => withDates<TaskRecord>(d, TASK_DATES))
    .filter((t) => t.status === "MISSED");
}

export async function overduePendingTasks(): Promise<TaskRecord[]> {
  const snap = await adminDb.collection("tasks").where("status", "==", "PENDING").get();
  const now = Date.now();
  return snap.docs
    .map((d) => withDates<TaskRecord>(d, TASK_DATES))
    .filter((t) => t.deadline.getTime() < now);
}

/** assigneeId -> count of tasks with the given status (or all if omitted). */
export async function taskCountsByAssignee(status?: string): Promise<Map<string, number>> {
  const snap = await adminDb.collection("tasks").get();
  const map = new Map<string, number>();
  for (const d of snap.docs) {
    const data = d.data();
    if (status && data.status !== status) continue;
    const uid = String(data.assignedToId);
    map.set(uid, (map.get(uid) ?? 0) + 1);
  }
  return map;
}

export async function countCompletedTasks(userId: string): Promise<number> {
  const snap = await adminDb
    .collection("tasks")
    .where("assignedToId", "==", userId)
    .where("status", "==", "COMPLETED")
    .get();
  return snap.size;
}

/** Built-in task types merged with any custom ones saved in settings/taskTypes. */
export async function listTaskTypes(): Promise<string[]> {
  const doc = await adminDb.collection("settings").doc("taskTypes").get();
  const custom = Array.isArray(doc.data()?.options) ? (doc.data()!.options as string[]) : [];
  return [...new Set([...DEFAULT_TASK_TYPES, ...custom])];
}

// ---------------------------------------------------------------------------
// Jobs / careers
// ---------------------------------------------------------------------------

/** Public job openings. `onlyActive` filters to currently-listed roles. */
export async function listJobs(onlyActive = false): Promise<JobRecord[]> {
  const snap = await adminDb.collection("jobs").get();
  const jobs = snap.docs.map((d) => withDates<JobRecord>(d, ["createdAt"])).sort(newest);
  return onlyActive ? jobs.filter((j) => j.active) : jobs;
}

/** Job applications submitted from the public careers page. */
export async function listJobApplications(): Promise<JobApplicationRecord[]> {
  const snap = await adminDb.collection("jobApplications").get();
  return snap.docs
    .map((d) => withDates<JobApplicationRecord>(d, ["createdAt"]))
    .sort(newest);
}

// ---------------------------------------------------------------------------
// Task requests
// ---------------------------------------------------------------------------

export async function listRequestsWithRefs(): Promise<
  (RequestRecord & {
    task: TaskRecord & { client: { name: string }; assignedTo: { name: string } };
  })[]
> {
  const snap = await adminDb.collection("taskRequests").get();
  const requests = snap.docs
    .map((d) => withDates<RequestRecord>(d, REQUEST_DATES))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
      return newest(a, b);
    });

  const [tasksSnap, users, clientsSnap] = await Promise.all([
    adminDb.collection("tasks").get(),
    userNameMap(),
    adminDb.collection("clients").get(),
  ]);
  const taskMap = new Map(tasksSnap.docs.map((d) => [d.id, withDates<TaskRecord>(d, TASK_DATES)]));
  const clientNames = new Map(clientsSnap.docs.map((d) => [d.id, String(d.data().name ?? "")]));

  return requests.flatMap((r) => {
    const task = taskMap.get(r.taskId);
    if (!task) return [];
    return [
      {
        ...r,
        task: {
          ...task,
          client: { name: clientNames.get(task.clientId) ?? "" },
          assignedTo: { name: users.get(task.assignedToId) ?? "" },
        },
      },
    ];
  });
}

export async function countOpenRequests(): Promise<number> {
  const snap = await adminDb.collection("taskRequests").where("status", "==", "OPEN").get();
  return snap.size;
}

// ---------------------------------------------------------------------------
// Client payments (two-date model: forMonth = service month, receivedAt = settled)
// ---------------------------------------------------------------------------

const PAYMENT_DATES = ["paidAt", "receivedAt", "dueDate", "lastContactedAt", "createdAt"];

function mapPayment(doc: FirebaseFirestore.DocumentSnapshot): PaymentRecord {
  const p = withDates<PaymentRecord>(doc, PAYMENT_DATES);
  // legacy docs stored the settled date in `paidAt`
  if (!p.receivedAt && p.paidAt) p.receivedAt = p.paidAt;
  p.followUps = p.followUps ?? 0;
  return p;
}

export async function listPayments(): Promise<PaymentRecord[]> {
  const snap = await adminDb.collection("clientPayments").get();
  return snap.docs.map(mapPayment).sort((a, b) => {
    const da = a.dueDate ?? a.receivedAt ?? a.createdAt;
    const dbb = b.dueDate ?? b.receivedAt ?? b.createdAt;
    return (dbb?.getTime() ?? 0) - (da?.getTime() ?? 0);
  });
}

export async function listPaymentsWithClient(): Promise<
  (PaymentRecord & { client: { id: string; name: string } })[]
> {
  const [payments, clientsSnap] = await Promise.all([
    listPayments(),
    adminDb.collection("clients").get(),
  ]);
  const clientNames = new Map(clientsSnap.docs.map((d) => [d.id, String(d.data().name ?? "")]));
  return payments.map((p) => ({
    ...p,
    client: { id: p.clientId, name: clientNames.get(p.clientId) ?? "" },
  }));
}

export type PaymentStatus = "RECEIVED" | "OVERDUE" | "DUE_TODAY" | "PENDING";

export function paymentStatus(p: PaymentRecord, now = new Date()): PaymentStatus {
  if (p.receivedAt) return "RECEIVED";
  if (!p.dueDate) return "PENDING";
  const due = p.dueDate;
  const sameDay =
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate();
  if (due.getTime() < now.getTime() && !sameDay) return "OVERDUE";
  if (sameDay) return "DUE_TODAY";
  return "PENDING";
}

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// Expenses, subscriptions, dharam, settings, activity
// ---------------------------------------------------------------------------

export async function listExpenses(): Promise<ExpenseRecord[]> {
  const snap = await adminDb.collection("expenses").get();
  return snap.docs
    .map((d) => withDates<ExpenseRecord>(d, ["date", "createdAt"]))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function listSubscriptions(): Promise<SubscriptionRecord[]> {
  const snap = await adminDb.collection("subscriptions").get();
  return snap.docs
    .map((d) => withDates<SubscriptionRecord>(d, ["nextPaymentDate", "createdAt"]))
    .sort(byName);
}

export async function listDisbursements(): Promise<DisbursementRecord[]> {
  const snap = await adminDb.collection("dharamDisbursements").get();
  return snap.docs
    .map((d) => withDates<DisbursementRecord>(d, ["date", "createdAt"]))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getFinanceSettings(): Promise<FinanceSettings> {
  const doc = await adminDb.collection("settings").doc("finance").get();
  const d = doc.data() ?? {};
  return {
    monthlyRevenueTarget: Number(d.monthlyRevenueTarget ?? 0),
    dharamPercent: Number(d.dharamPercent ?? 5),
  };
}

export async function logActivity(type: string, message: string) {
  await adminDb
    .collection("activityLog")
    .add({ type, message, createdAt: FieldValue.serverTimestamp() })
    .catch(() => null);
}

export async function listActivity(limit = 12): Promise<ActivityRecord[]> {
  const snap = await adminDb.collection("activityLog").get();
  return snap.docs
    .map((d) => withDates<ActivityRecord>(d, ["createdAt"]))
    .sort(newest)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Lazy finance engines (run on finance page loads, like checkMissedDeadlines)
// ---------------------------------------------------------------------------

/** Due date for a client's charge of a given service month ("YYYY-MM"). */
function chargeDueDate(client: ClientRecord, forMonth: string): Date {
  const [y, m] = forMonth.split("-").map(Number);
  const day = Math.min(Math.max(client.billingDay ?? 1, 1), 28); // safe for Feb
  if (client.billingModel === "MID_MONTH") return new Date(y, m - 1, 15);
  if (client.billingModel === "POSTPAID") return new Date(y, m, day); // next month
  return new Date(y, m - 1, day); // PREPAID / POST_WORK
}

/**
 * Ensures every ACTIVE client with a monthlyFee has a pending payment row for
 * the current service month. Safe to call on every finance page load.
 */
export async function ensureMonthlyCharges() {
  const clients = (await listClients()).filter(
    (c) => c.status !== "ARCHIVED" && c.monthlyFee != null && c.monthlyFee > 0 && c.billingDay
  );
  if (clients.length === 0) return;
  const snap = await adminDb.collection("clientPayments").get();
  const existing = new Set(
    snap.docs.map((d) => `${d.data().clientId}:${d.data().forMonth ?? ""}`)
  );
  const key = monthKeyOf(new Date());
  const batch = adminDb.batch();
  let n = 0;
  for (const c of clients) {
    if (existing.has(`${c.id}:${key}`)) continue;
    const ref = adminDb.collection("clientPayments").doc();
    batch.set(ref, {
      clientId: c.id,
      amount: c.monthlyFee,
      forMonth: key,
      dueDate: Timestamp.fromDate(chargeDueDate(c, key)),
      receivedAt: null,
      paidAt: null,
      method: null,
      note: "Auto-generated monthly retainer",
      followUps: 0,
      lastContactedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    n++;
  }
  if (n > 0) await batch.commit();
}

/**
 * For each active subscription whose nextPaymentDate has passed, log an
 * expense and roll the date forward to the next future occurrence.
 */
export async function processSubscriptions() {
  const subs = (await listSubscriptions()).filter((s) => s.active);
  const now = new Date();
  for (const s of subs) {
    let next = s.nextPaymentDate;
    let changed = false;
    while (next.getTime() <= now.getTime()) {
      await adminDb.collection("expenses").add({
        category: "Subscription",
        amount: s.amount,
        date: Timestamp.fromDate(next),
        note: `${s.name} (${s.cycle === "YEARLY" ? "yearly" : "monthly"} renewal)`,
        staffId: null,
        subscriptionId: s.id,
        createdAt: FieldValue.serverTimestamp(),
      });
      next =
        s.cycle === "YEARLY"
          ? new Date(next.getFullYear() + 1, next.getMonth(), next.getDate())
          : new Date(next.getFullYear(), next.getMonth() + 1, next.getDate());
      changed = true;
    }
    if (changed) {
      await adminDb
        .collection("subscriptions")
        .doc(s.id)
        .update({ nextPaymentDate: Timestamp.fromDate(next) });
    }
  }
}

// ---------------------------------------------------------------------------
// Finance aggregates
// ---------------------------------------------------------------------------

export type MonthBucket = {
  month: string;
  received: number;
  expenses: number;
  net: number;
};

/** Revenue (by receivedAt) and expenses (by date) bucketed per "YYYY-MM". */
export function bucketByMonth(
  payments: PaymentRecord[],
  expenses: ExpenseRecord[]
): Map<string, MonthBucket> {
  const map = new Map<string, MonthBucket>();
  const get = (k: string) => {
    let b = map.get(k);
    if (!b) map.set(k, (b = { month: k, received: 0, expenses: 0, net: 0 }));
    return b;
  };
  for (const p of payments) {
    if (p.receivedAt) get(monthKeyOf(p.receivedAt)).received += p.amount;
  }
  for (const e of expenses) {
    get(monthKeyOf(e.date)).expenses += e.amount;
  }
  for (const b of map.values()) b.net = b.received - b.expenses;
  return map;
}
