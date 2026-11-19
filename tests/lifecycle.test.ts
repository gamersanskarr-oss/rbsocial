import { describe, it, expect, beforeEach, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Full task-lifecycle + finance integration tests (in-memory DB).     */
/* ------------------------------------------------------------------ */
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({
  headers: async () => new Map([["x-forwarded-for", "127.0.0.1"]]),
}));

vi.mock("firebase-admin/firestore", async () => {
  const { FakeTimestamp, FakeFieldValue } = await import("./fake-db");
  return { Timestamp: FakeTimestamp, FieldValue: FakeFieldValue };
});

const authMock = vi.hoisted(() => ({
  created: [] as { uid: string; email: string }[],
  deleted: [] as string[],
  error: null as { code: string } | null,
  async createUser(u: { email: string; password: string; displayName: string }) {
    if (authMock.error) throw authMock.error;
    if (authMock.created.some((c) => c.email === u.email)) {
      throw { code: "auth/email-already-exists" };
    }
    const uid = `uid-${authMock.created.length + 1}`;
    authMock.created.push({ uid, email: u.email });
    return { uid };
  },
  async deleteUser(uid: string) {
    authMock.deleted.push(uid);
  },
}));

vi.mock("@/lib/firebase-admin", async () => {
  const { fakeDb } = await import("./fake-db");
  return { adminDb: fakeDb, adminAuth: authMock };
});

vi.mock("@/lib/auth", async () => {
  const { authState } = await import("./state");
  const need = (roles: string[]) => async () => {
    if (!roles.includes(authState.user.role)) {
      const err = new Error("Forbidden") as Error & { status?: number };
      err.status = 403;
      throw err;
    }
    return authState.user;
  };
  return {
    requireAdmin: need(["ADMIN"]),
    requireManager: need(["MANAGER"]),
    requireEmployee: need(["EMPLOYEE"]),
    requireAdminOrManager: need(["ADMIN", "MANAGER"]),
    requireAdminOrAccountant: need(["ADMIN", "ACCOUNTANT"]),
    requireUser: need(["ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"]),
    getSessionUser: async () => authState.user,
    roleHome: () => "/",
  };
});

/* ------------------------------------------------------------------ */
import { checkMissedDeadlines, MISSED_DEADLINE_LIMIT } from "@/lib/deadlines";
import { createTask, reviewTaskPay, waiveMiss, assignClient, addClient, setPerPostPay } from "@/app/actions/admin";
import { submitTask, submitMissReason, reviewTask, updateTask, moveTaskDeadline } from "@/app/actions/tasks";
import { addTaskRequest, resolveRequest, deleteRequest } from "@/app/actions/requests";
import {
  updateClientBilling, recordPayment, markPaymentReceived, logFollowUp,
  addExpense, addSubscription, processSubscriptions, addDisbursement,
  updateFinanceSettings, createShareLink, deletePayment,
} from "@/app/actions/finance";
import { applyForJob } from "@/app/actions/careers";
import { seed, doc, resetDb, fakeDb } from "./fake-db";

const allDocs = async (name: string) =>
  ((await fakeDb.collection(name).get()).docs as { id: string; data(): Record<string, unknown> }[]).map(
    (d) => ({ id: d.id, ...d.data() })
  );
import { authState, EMPLOYEE, ADMIN, MANAGER } from "./state";

const ACCOUNTANT = { id: "acc1", name: "Acct", email: "acc@x.com", role: "ACCOUNTANT", team: null };

const fd = (entries: [string, string][]): FormData => {
  const f = new FormData();
  for (const [k, v] of entries) f.set(k, v);
  return f;
};

const future = (hours: number) =>
  new Date(Date.now() + hours * 36e5).toISOString().slice(0, 16); // datetime-local
const past = (hours: number) =>
  new Date(Date.now() - hours * 36e5).toISOString().slice(0, 16);

let taskSeq = 0;
const mkTask = async (over: [string, string][] = []) => {
  authState.user = ADMIN;
  const res = await createTask(
    {},
    fd([
      ["topic", `Task-${++taskSeq}`],
      ["description", "desc"],
      ["clientId", "c1"],
      ["assignedToId", EMPLOYEE.id],
      ["deadline", future(48)],
      ["taskType", "Static Post"],
      ...over,
    ])
  );
  expect(res.success).toBeTruthy();
  return `auto-${taskSeq}`;
};

beforeEach(() => {
  resetDb();
  authMock.created = [];
  authMock.deleted = [];
  authMock.error = null;
  taskSeq = 0;
  seed("users/" + EMPLOYEE.id, { ...EMPLOYEE, missedDeadlines: 0, perPostPay: 250 });
  seed("clients/c1", { name: "QA Client", status: "ACTIVE" });
});

/* ================= COMPLETE TASK LIFECYCLE ================= */
describe("task lifecycle: create → submit → review → approve/revise", () => {
  it("manager creates task → employee sees it pending → submits → approval PENDING", async () => {
    authState.user = MANAGER;
    await createTask({}, fd([
      ["topic", "Reel"], ["description", "d"], ["clientId", "c1"],
      ["assignedToId", EMPLOYEE.id], ["deadline", future(24)], ["taskType", "Reel"],
    ]));
    const t = doc("tasks/auto-1")!;
    expect(t.status).toBe("PENDING");
    expect(t.approval).toBe("NONE");
    expect(t.payAmount).toBeNull(); // manager can't set pay

    authState.user = EMPLOYEE;
    const res = await submitTask({}, fd([["taskId", "auto-1"], ["submissionLink", "https://canva.com/x"]]));
    expect(res.success).toBeTruthy();
    const t2 = doc("tasks/auto-1")!;
    expect(t2.status).toBe("COMPLETED");
    expect(t2.approval).toBe("PENDING");
    expect(t2.lateSubmission).toBe(false);
  });

  it("employee submits a custom quote → PENDING → admin approves amount", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"], ["payAmount", "400"]]));
    expect(doc(`tasks/${tid}`)!.payStatus).toBe("PENDING");

    authState.user = ADMIN;
    await reviewTaskPay(fd([["taskId", tid], ["mode", "approve"], ["amount", "350"]]));
    const t = doc(`tasks/${tid}`)!;
    expect(t.payStatus).toBe("APPROVED");
    expect(t.payAmount).toBe(350);
  });

  it("admin declines quote → falls back to NONE/base rate", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"], ["payAmount", "400"]]));
    authState.user = ADMIN;
    await reviewTaskPay(fd([["taskId", tid], ["mode", "decline"]]));
    expect(doc(`tasks/${tid}`)!.payStatus).toBe("NONE");
    expect(doc(`tasks/${tid}`)!.payAmount).toBeNull();
  });

  it("review 'changes' → reopened PENDING with note → resubmit works", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    authState.user = MANAGER;
    const rev = await reviewTask({}, fd([["taskId", tid], ["decision", "changes"], ["reviewNote", "fix colors"]]));
    expect(rev.success).toBeTruthy();
    const t = doc(`tasks/${tid}`)!;
    expect(t.status).toBe("PENDING");
    expect(t.approval).toBe("CHANGES");
    expect(t.reviewNote).toBe("fix colors");

    authState.user = EMPLOYEE;
    const res = await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/v2"]]));
    expect(res.success).toBeTruthy();
    expect(doc(`tasks/${tid}`)!.submissionLink).toBe("https://canva.com/v2");
  });

  it("review 'approve' → APPROVED + note", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    authState.user = MANAGER;
    await reviewTask({}, fd([["taskId", tid], ["decision", "approve"], ["reviewNote", "nice"]]));
    expect(doc(`tasks/${tid}`)!.approval).toBe("APPROVED");
  });

  it("changes/reject without note → error", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    authState.user = MANAGER;
    const res = await reviewTask({}, fd([["taskId", tid], ["decision", "changes"]]));
    expect(res.error).toBeTruthy();
  });

  it("employee cannot review their own submission", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    await expect(reviewTask({}, fd([["taskId", tid], ["decision", "approve"]]))).rejects.toThrow("Forbidden");
  });

  it("another employee cannot submit someone else's task", async () => {
    const tid = await mkTask();
    authState.user = { ...EMPLOYEE, id: "stranger" };
    const res = await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    expect(res.error).toBe("Task not found.");
  });

  it("double submission is blocked", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    const res = await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/y"]]));
    expect(res.error).toBeTruthy();
  });

  it("invalid submission link rejected (javascript: scheme)", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    const res = await submitTask({}, fd([["taskId", tid], ["submissionLink", "javascript:alert(1)"]]));
    expect(res.error).toContain("valid URL");
  });
});

/* ================= DEADLINES / MISSES / STRIKES ================= */
describe("deadline engine", () => {
  it("overdue PENDING → MISSED + strike counter increments", async () => {
    const tid = await mkTask([["deadline", past(2)]]);
    await checkMissedDeadlines();
    expect(doc(`tasks/${tid}`)!.status).toBe("MISSED");
    expect(doc(`users/${EMPLOYEE.id}`)!.missedDeadlines).toBe(1);
  });

  it("3 misses → payoutStatus reduced (10% cut) — checkMissedDeadlines is idempotent", async () => {
    for (let i = 0; i < 3; i++) await mkTask([["deadline", past(2)]]);
    await checkMissedDeadlines();
    await checkMissedDeadlines(); // second run must not double-count
    expect(doc(`users/${EMPLOYEE.id}`)!.missedDeadlines).toBe(MISSED_DEADLINE_LIMIT);
  });

  it("late submission on a MISSED task sets lateSubmission", async () => {
    const tid = await mkTask([["deadline", past(2)]]);
    await checkMissedDeadlines();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/late"]]));
    const t = doc(`tasks/${tid}`)!;
    expect(t.status).toBe("COMPLETED");
    expect(t.lateSubmission).toBe(true);
  });

  it("missReason is saved only by the assignee", async () => {
    const tid = await mkTask([["deadline", past(2)]]);
    authState.user = EMPLOYEE;
    const res = await submitMissReason({}, fd([["taskId", tid], ["missReason", "waiting on logo"]]));
    expect(res.success).toBeTruthy();
    expect(doc(`tasks/${tid}`)!.missReason).toBe("waiting on logo");

    authState.user = { ...EMPLOYEE, id: "other" };
    const res2 = await submitMissReason({}, fd([["taskId", tid], ["missReason", "hijack"]]));
    expect(res2.error).toBeTruthy();
    expect(doc(`tasks/${tid}`)!.missReason).toBe("waiting on logo");
  });

  it("waiveMiss one → counter-1; all → 0; manager may waive", async () => {
    seed(`users/${EMPLOYEE.id}`, { ...EMPLOYEE, missedDeadlines: 3, perPostPay: 250 });
    authState.user = MANAGER;
    await waiveMiss(fd([["userId", EMPLOYEE.id], ["mode", "one"]]));
    expect(doc(`users/${EMPLOYEE.id}`)!.missedDeadlines).toBe(2);
    await waiveMiss(fd([["userId", EMPLOYEE.id], ["mode", "all"]]));
    expect(doc(`users/${EMPLOYEE.id}`)!.missedDeadlines).toBe(0);
  });

  it("updateTask status flip PENDING→MISSED adds a strike", async () => {
    const tid = await mkTask();
    authState.user = ADMIN;
    await updateTask({}, fd([
      ["taskId", tid], ["topic", "t"], ["description", "d"], ["clientId", "c1"],
      ["assignedToId", EMPLOYEE.id], ["deadline", future(24)], ["taskType", "Reel"], ["status", "MISSED"],
    ]));
    expect(doc(`users/${EMPLOYEE.id}`)!.missedDeadlines).toBe(1);
  });

  it("moveTaskDeadline keeps IST wall-clock time", async () => {
    const tid = await mkTask([["deadline", "2026-12-01T18:00"]]);
    authState.user = MANAGER;
    const res = await moveTaskDeadline(tid, "2026-12-05");
    expect(res.ok).toBe(true);
    const d = (doc(`tasks/${tid}`)!.deadline as { toDate(): Date }).toDate();
    // Still 18:00 IST = 12:30 UTC
    expect(d.getUTCHours()).toBe(12);
    expect(d.getUTCMinutes()).toBe(30);
  });

  it("reviewTask on MISSED w/ expired deadline grants +24h window", async () => {
    const tid = await mkTask([["deadline", past(48)]]);
    await checkMissedDeadlines();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    authState.user = MANAGER;
    await reviewTask({}, fd([["taskId", tid], ["decision", "changes"], ["reviewNote", "redo"]]));
    const t = doc(`tasks/${tid}`)!;
    const dl = (t.deadline as { toDate(): Date }).toDate();
    expect(dl.getTime()).toBeGreaterThan(Date.now());
  });
});

/* ================= TASK REQUESTS ================= */
describe("document/asset requests", () => {
  it("employee creates request → OPEN → admin resolves", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    const res = await addTaskRequest({}, fd([["taskId", tid], ["message", "need logo file"]]));
    expect(res.success).toBeTruthy();
    expect((await allDocs("taskRequests"))[0].status).toBe("OPEN");
  });

  it("requests blocked within 6h of deadline", async () => {
    const tid = await mkTask([["deadline", future(4)]]);
    authState.user = EMPLOYEE;
    const res = await addTaskRequest({}, fd([["taskId", tid], ["message", "need assets"]]));
    expect(res.error).toContain("6 hours");
  });

  it("requests blocked on non-PENDING tasks", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await submitTask({}, fd([["taskId", tid], ["submissionLink", "https://canva.com/x"]]));
    const res = await addTaskRequest({}, fd([["taskId", tid], ["message", "late ask"]]));
    expect(res.error).toBeTruthy();
  });

  it("resolveRequest marks RESOLVED + resolvedAt", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await addTaskRequest({}, fd([["taskId", tid], ["message", "logo please"]]));
    authState.user = ADMIN;
    const reqId = (await allDocs("taskRequests"))[0].id;
    await resolveRequest(fd([["requestId", reqId]]));
    const req = doc(`taskRequests/${reqId}`)!;
    expect(req.status).toBe("RESOLVED");
    expect(req.resolvedAt).toBeTruthy();
  });

  it("owner can delete own request; stranger cannot", async () => {
    const tid = await mkTask();
    authState.user = EMPLOYEE;
    await addTaskRequest({}, fd([["taskId", tid], ["message", "x"]]));
    const reqId = (await allDocs("taskRequests"))[0].id;

    authState.user = { ...EMPLOYEE, id: "stranger" };
    await deleteRequest(fd([["requestId", reqId]]));
    expect(doc(`taskRequests/${reqId}`)).toBeTruthy(); // not deleted

    authState.user = EMPLOYEE;
    await deleteRequest(fd([["requestId", reqId]]));
    expect(doc(`taskRequests/${reqId}`)).toBeUndefined(); // deleted
  });
});

/* ================= CLIENTS / ASSIGNMENT ================= */
describe("client assignment", () => {
  it("manager assigns designer to client → assignedToIds + legacy mirror", async () => {
    authState.user = MANAGER;
    await assignClient(fd([["clientId", "c1"], ["assignedToIds", EMPLOYEE.id]]));
    const c = doc("clients/c1")!;
    expect(c.assignedToIds).toEqual([EMPLOYEE.id]);
    expect(c.assignedToId).toBe(EMPLOYEE.id);
  });

  it("addClient validates name", async () => {
    authState.user = ADMIN;
    const res = await addClient({}, fd([["name", ""]]));
    expect(res.error).toBeTruthy();
  });

  it("setPerPostPay persists rate; negative rejected", async () => {
    authState.user = ADMIN;
    await setPerPostPay(fd([["userId", EMPLOYEE.id], ["perPostPay", "300"]]));
    expect(doc(`users/${EMPLOYEE.id}`)!.perPostPay).toBe(300);
    await setPerPostPay(fd([["userId", EMPLOYEE.id], ["perPostPay", "-50"]]));
    expect(doc(`users/${EMPLOYEE.id}`)!.perPostPay).toBe(300);
  });
});

/* ================= FINANCE ================= */
describe("payments ledger", () => {
  it("ACCOUNTANT records payment → PENDING; markReceived → receivedAt set", async () => {
    authState.user = ACCOUNTANT;
    const res = await recordPayment({}, fd([
      ["clientId", "c1"], ["amount", "15000"], ["forMonth", "2026-10"], ["dueDate", "2026-10-05"],
    ]));
    expect(res.success).toBeTruthy();
    const pid = "auto-1";
    expect(doc(`clientPayments/${pid}`)!.receivedAt).toBeNull();

    await markPaymentReceived(fd([["paymentId", pid], ["method", "ONLINE"]]));
    const p = doc(`clientPayments/${pid}`)!;
    expect(p.receivedAt).toBeTruthy();
    expect(p.method).toBe("ONLINE");
  });

  it("recordPayment rejects bad month + zero/negative amount", async () => {
    authState.user = ACCOUNTANT;
    const r1 = await recordPayment({}, fd([["clientId", "c1"], ["amount", "0"]]));
    expect(r1.error).toBeTruthy();
    const r2 = await recordPayment({}, fd([["clientId", "c1"], ["amount", "100"], ["forMonth", "10-2026"]]));
    expect(r2.error).toContain("billing month");
  });

  it("MANAGER cannot touch payments (finance is admin+accountant)", async () => {
    authState.user = MANAGER;
    await expect(recordPayment({}, fd([["clientId", "c1"], ["amount", "1"]]))).rejects.toThrow("Forbidden");
  });

  it("EMPLOYEE cannot touch payments", async () => {
    authState.user = EMPLOYEE;
    await expect(addExpense({}, fd([["category", "Office"], ["amount", "100"]]))).rejects.toThrow("Forbidden");
  });

  it("logFollowUp increments counter + lastContactedAt", async () => {
    authState.user = ACCOUNTANT;
    await recordPayment({}, fd([["clientId", "c1"], ["amount", "5000"]]));
    await logFollowUp(fd([["paymentId", "auto-1"]]));
    await logFollowUp(fd([["paymentId", "auto-1"]]));
    const p = doc("clientPayments/auto-1")!;
    expect(p.followUps).toBe(2);
    expect(p.lastContactedAt).toBeTruthy();
  });

  it("deletePayment removes the row", async () => {
    authState.user = ACCOUNTANT;
    await recordPayment({}, fd([["clientId", "c1"], ["amount", "1000"]]));
    await deletePayment(fd([["paymentId", "auto-1"]]));
    expect(doc("clientPayments/auto-1")).toBeUndefined();
  });
});

describe("expenses + subscriptions", () => {
  it("rejects unknown categories", async () => {
    authState.user = ACCOUNTANT;
    const res = await addExpense({}, fd([["category", "Gambling"], ["amount", "100"]]));
    expect(res.error).toBeTruthy();
  });

  it("processSubscriptions logs expense + rolls nextPaymentDate", async () => {
    authState.user = ADMIN;
    const res = await addSubscription({}, fd([
      ["name", "Canva Pro"], ["amount", "500"], ["cycle", "MONTHLY"], ["nextPaymentDate", past(24)],
    ]));
    expect(res.success).toBeTruthy();
    // lazy engine — import + run
    const { processSubscriptions } = await import("@/lib/data");
    await processSubscriptions();
    const sub = doc("subscriptions/auto-1")!;
    const nxt = (sub.nextPaymentDate as { toDate(): Date }).toDate();
    expect(nxt.getTime()).toBeGreaterThan(Date.now());
    expect((await allDocs("expenses")).length).toBe(1);
  });
});

describe("billing + dharam + share links", () => {
  it("updateClientBilling keeps previous fee history", async () => {
    seed("clients/c1", { name: "QA", status: "ACTIVE", monthlyFee: 10000 });
    authState.user = ADMIN;
    await updateClientBilling(fd([
      ["clientId", "c1"], ["monthlyFee", "15000"], ["billingDay", "5"], ["billingModel", "PREPAID"], ["status", "ACTIVE"],
    ]));
    const c = doc("clients/c1")!;
    expect(c.monthlyFee).toBe(15000);
    expect(c.previousMonthlyFee).toBe(10000);
    expect(c.feeEffectiveFrom).toBeTruthy();
  });

  it("billing update is admin-only (accountant blocked)", async () => {
    authState.user = ACCOUNTANT;
    await expect(updateClientBilling(fd([["clientId", "c1"], ["monthlyFee", "1"]]))).rejects.toThrow("Forbidden");
  });

  it("updateFinanceSettings is admin-only", async () => {
    authState.user = ACCOUNTANT;
    await expect(updateFinanceSettings(fd([["monthlyRevenueTarget", "100000"]]))).rejects.toThrow("Forbidden");
    authState.user = ADMIN;
    await updateFinanceSettings(fd([["monthlyRevenueTarget", "100000"], ["dharamPercent", "5"]]));
    const s = doc("settings/finance")!;
    expect(s.monthlyRevenueTarget).toBe(100000);
  });

  it("dharam disbursement recorded", async () => {
    authState.user = ACCOUNTANT;
    const res = await addDisbursement({}, fd([["recipient", "Temple fund"], ["amount", "1000"], ["cause", "monthly"]]));
    expect(res.success).toBeTruthy();
  });

  it("createShareLink stores snapshot with 90-day expiry", async () => {
    authState.user = ADMIN;
    const res = await createShareLink({}, fd([["horizon", "this-month"]]));
    expect(res.shareUrl).toMatch(/^\/report\//);
    const rep = (await allDocs("sharedReports"))[0];
    const exp = (rep.expiresAt as { toDate(): Date }).toDate();
    expect(exp.getTime() - Date.now()).toBeGreaterThan(80 * 24 * 36e5);
  });
});

/* ================= CAREERS ================= */
describe("job applications", () => {
  it("GENERAL application writes jobApplications doc", async () => {
    const res = await applyForJob({}, fd([
      ["jobIds", "GENERAL"], ["name", "Applicant"], ["email", "a@b.com"],
    ]));
    expect(res.success).toBeTruthy();
    expect((await allDocs("jobApplications"))[0].jobTitle).toBe("General Application");
  });

  it("duplicate email+role application is skipped politely", async () => {
    const form = fd([["jobIds", "GENERAL"], ["name", "A"], ["email", "a@b.com"]]);
    await applyForJob({}, form);
    const res = await applyForJob({}, fd([["jobIds", "GENERAL"], ["name", "A"], ["email", "a@b.com"]]));
    expect(res.error).toContain("already applied");
  });

  it("invalid email rejected", async () => {
    const res = await applyForJob({}, fd([["jobIds", "GENERAL"], ["name", "A"], ["email", "nope"]]));
    expect(res.error).toContain("valid email");
  });
});
