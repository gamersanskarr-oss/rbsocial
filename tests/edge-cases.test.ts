import { describe, it, expect, beforeEach, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Mocks — same harness as dashboard.test.ts                          */
/* ------------------------------------------------------------------ */
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("firebase-admin/firestore", async () => {
  const { FakeTimestamp, FakeFieldValue } = await import("./fake-db");
  return { Timestamp: FakeTimestamp, FieldValue: FakeFieldValue };
});
vi.mock("@/lib/firebase-admin", async () => {
  const { fakeDb } = await import("./fake-db");
  return { adminDb: fakeDb, adminAuth: {} };
});
vi.mock("@/lib/auth", async () => {
  const { authState } = await import("./state");
  const user = async () => authState.user;
  return {
    requireAdmin: user,
    requireManager: user,
    requireEmployee: user,
    requireUser: user,
    requireAdminOrManager: user,
    requireAdminOrAccountant: user,
    getSessionUser: user,
    roleHome: () => "/",
  };
});

/* ------------------------------------------------------------------ */
/* Real code under test                                                */
/* ------------------------------------------------------------------ */
import { checkMissedDeadlines } from "@/lib/deadlines";
import {
  submitTask,
  submitMissReason,
  moveTaskDeadline,
  reviewTask,
  updateTask,
} from "@/app/actions/tasks";
import { createTask, reviewTaskPay, waiveMiss } from "@/app/actions/admin";
import { addTaskRequest, resolveRequest, deleteRequest } from "@/app/actions/requests";
import {
  taskPay,
  parseISTDateTime,
  shiftISTDay,
  clientAssignees,
  parseClientRequirements,
  getTaskDetail,
} from "@/lib/data";
import { seed, doc, resetDb, ts } from "./fake-db";
import { authState, EMPLOYEE, OTHER_EMPLOYEE, ADMIN, MANAGER } from "./state";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const hours = (h: number) => new Date(Date.now() + h * 36e5);
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const seedEmployee = (id = "emp1", missed = 0) =>
  seed(`users/${id}`, {
    name: "Priya",
    email: "p@x",
    role: "EMPLOYEE",
    team: "DESIGN",
    missedDeadlines: missed,
    perPostPay: 500,
  });

const seedClient = (id = "c1") =>
  seed(`clients/${id}`, { name: "Acme", assignedToIds: ["emp1"], assignedToId: "emp1" });

const seedTask = (id: string, over: Record<string, unknown> = {}) =>
  seed(`tasks/${id}`, {
    topic: "T",
    description: "D",
    clientId: "c1",
    assignedToId: "emp1",
    deadline: ts(hours(24)),
    status: "PENDING",
    type: "Static Post",
    slideCount: null,
    payAmount: null,
    payStatus: "NONE",
    approval: "NONE",
    reviewNote: null,
    missReason: null,
    lateSubmission: false,
    referenceLink: null,
    submissionLink: null,
    completedAt: null,
    createdAt: ts(new Date("2026-10-01")),
    ...over,
  });

const validSubmit = (over: Record<string, string> = {}) =>
  fd({ taskId: "t1", submissionLink: "https://canva.com/x", ...over });

const validEdit = (over: Record<string, string> = {}) =>
  fd({
    taskId: "t1",
    topic: "T",
    description: "D",
    clientId: "c1",
    assignedToId: "emp1",
    deadline: "2026-11-01T18:00",
    taskType: "Static Post",
    slideCount: "",
    status: "PENDING",
    referenceLink: "",
    submissionLink: "",
    ...over,
  });

const validCreate = (over: Record<string, string> = {}) =>
  fd({
    topic: "T",
    description: "D",
    clientId: "c1",
    assignedToId: "emp1",
    deadline: "2026-11-05T18:00",
    taskType: "Static Post",
    slideCount: "",
    referenceLink: "",
    ...over,
  });

beforeEach(() => {
  resetDb();
  authState.user = EMPLOYEE;
});

/* ================================================================== */
/* submitTask edge cases                                               */
/* ================================================================== */
describe("submitTask edge cases", () => {
  it("rejects an empty submission link", async () => {
    seedTask("t1");
    const res = await submitTask({}, fd({ taskId: "t1", submissionLink: "  " }));
    expect(res.error).toContain("link");
  });

  it("rejects javascript: URLs — they would XSS the admin's page", async () => {
    seedTask("t1");
    const res = await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "javascript:alert(1)" })
    );
    expect(res.error).toContain("valid URL");
    expect(doc("tasks/t1")!.status).toBe("PENDING");
  });

  it("rejects non-http protocols like ftp:", async () => {
    seedTask("t1");
    const res = await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "ftp://files.x/a.zip" })
    );
    expect(res.error).toContain("valid URL");
  });

  it("rejects a negative quote", async () => {
    seedTask("t1");
    const res = await submitTask({}, validSubmit({ payAmount: "-50" }));
    expect(res.error).toContain("valid number");
  });

  it("rejects a non-numeric quote", async () => {
    seedTask("t1");
    const res = await submitTask({}, validSubmit({ payAmount: "abc" }));
    expect(res.error).toContain("valid number");
  });

  it("a ₹0 quote is allowed and goes to PENDING review", async () => {
    seedTask("t1");
    await submitTask({}, validSubmit({ payAmount: "0" }));
    expect(doc("tasks/t1")!.payAmount).toBe(0);
    expect(doc("tasks/t1")!.payStatus).toBe("PENDING");
  });

  it("resubmitting the same amount does NOT reset an approved pay status", async () => {
    seedTask("t1", { status: "COMPLETED", approval: "CHANGES", payAmount: 700, payStatus: "APPROVED" });
    // reopen it first so a resubmission is possible
    seed("tasks/t1", { ...doc("tasks/t1")!, status: "PENDING" });
    await submitTask({}, validSubmit({ payAmount: "700" }));
    expect(doc("tasks/t1")!.payStatus).toBe("APPROVED"); // untouched
  });

  it("blank payAmount leaves the pay fields alone", async () => {
    seedTask("t1", { payAmount: 600, payStatus: "APPROVED" });
    await submitTask({}, validSubmit({ payAmount: "" }));
    expect(doc("tasks/t1")!.payAmount).toBe(600);
    expect(doc("tasks/t1")!.payStatus).toBe("APPROVED");
  });

  it("cannot submit an already-COMPLETED task", async () => {
    seedTask("t1", { status: "COMPLETED" });
    const res = await submitTask({}, validSubmit());
    expect(res.error).toContain("no longer");
  });

  it("nonexistent task id → Task not found", async () => {
    const res = await submitTask({}, validSubmit({ taskId: "ghost" }));
    expect(res.error).toBe("Task not found.");
  });

  it("missing taskId → Task not found", async () => {
    const res = await submitTask({}, fd({ submissionLink: "https://x.com" }));
    expect(res.error).toBe("Task not found.");
  });

  it("a resubmission after changes wipes the old review note and re-queues review", async () => {
    seedTask("t1", {
      status: "PENDING",
      approval: "CHANGES",
      reviewNote: "fix logo",
    });
    await submitTask({}, validSubmit());
    const t = doc("tasks/t1")!;
    expect(t.status).toBe("COMPLETED");
    expect(t.approval).toBe("PENDING");
    expect(t.reviewNote).toBeNull();
  });
});

/* ================================================================== */
/* submitMissReason edge cases                                         */
/* ================================================================== */
describe("submitMissReason edge cases", () => {
  it("rejects an empty reason", async () => {
    seedTask("t1", { status: "MISSED" });
    const res = await submitMissReason({}, fd({ taskId: "t1", missReason: "   " }));
    expect(res.error).toContain("reason");
  });

  it("truncates a reason over 500 chars", async () => {
    seedTask("t1", { status: "MISSED" });
    const long = "x".repeat(600);
    await submitMissReason({}, fd({ taskId: "t1", missReason: long }));
    expect((doc("tasks/t1")!.missReason as string).length).toBe(500);
  });

  it("ghost task → Task not found", async () => {
    const res = await submitMissReason({}, fd({ taskId: "ghost", missReason: "x" }));
    expect(res.error).toBe("Task not found.");
  });
});

/* ================================================================== */
/* moveTaskDeadline edge cases                                         */
/* ================================================================== */
describe("moveTaskDeadline edge cases", () => {
  it("ignores malformed dates", async () => {
    seedTask("t1");
    await moveTaskDeadline("t1", "garbage");
    await moveTaskDeadline("t1", "2026-1-5"); // not YYYY-MM-DD
    expect(doc("tasks/t1")!.status).toBe("PENDING");
  });

  it("silently no-ops on a ghost task", async () => {
    await moveTaskDeadline("ghost", "2026-10-10"); // must not throw
  });

  it("moving a MISSED task to another PAST day does NOT double-strike", async () => {
    seedEmployee("emp1", 1);
    seedTask("t1", { status: "MISSED", deadline: ts(hours(-4)) });
    await moveTaskDeadline("t1", isoDay(hours(-96)));
    expect(doc("tasks/t1")!.status).toBe("MISSED");
    expect(doc("users/emp1")!.missedDeadlines).toBe(1); // still 1
  });

  it("a COMPLETED task moves without touching status or strikes", async () => {
    seedEmployee();
    seedTask("t1", { status: "COMPLETED", completedAt: ts(hours(-2)) });
    await moveTaskDeadline("t1", isoDay(hours(-48)));
    expect(doc("tasks/t1")!.status).toBe("COMPLETED");
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });

  it("moving PENDING future→future keeps it PENDING, no strike", async () => {
    seedEmployee();
    seedTask("t1", { deadline: ts(hours(24)) });
    await moveTaskDeadline("t1", isoDay(hours(96)));
    expect(doc("tasks/t1")!.status).toBe("PENDING");
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });
});

/* ================================================================== */
/* reviewTask edge cases                                               */
/* ================================================================== */
describe("reviewTask edge cases", () => {
  const completed = (over: Record<string, unknown> = {}) =>
    seedTask("t1", {
      status: "COMPLETED",
      submissionLink: "https://canva.com/x",
      completedAt: ts(hours(-1)),
      approval: "PENDING",
      ...over,
    });

  it("rejects an invalid decision", async () => {
    authState.user = ADMIN;
    completed();
    const res = await reviewTask({}, fd({ taskId: "t1", decision: "maybe" }));
    expect(res.error).toContain("approve");
  });

  it("rejects an empty decision", async () => {
    authState.user = ADMIN;
    completed();
    const res = await reviewTask({}, fd({ taskId: "t1" }));
    expect(res.error).toBeTruthy();
  });

  it("cannot review a task with no submission", async () => {
    authState.user = ADMIN;
    seedTask("t1"); // still PENDING
    const res = await reviewTask({}, fd({ taskId: "t1", decision: "approve" }));
    expect(res.error).toContain("no submission");
  });

  it("ghost task → Task not found", async () => {
    authState.user = ADMIN;
    const res = await reviewTask({}, fd({ taskId: "ghost", decision: "approve" }));
    expect(res.error).toBe("Task not found.");
  });

  it("approve works without a note — reviewNote stays null", async () => {
    authState.user = ADMIN;
    completed();
    await reviewTask({}, fd({ taskId: "t1", decision: "approve", reviewNote: "" }));
    expect(doc("tasks/t1")!.approval).toBe("APPROVED");
    expect(doc("tasks/t1")!.reviewNote).toBeNull();
  });

  it("changes on a task with a FUTURE deadline keeps the original deadline", async () => {
    authState.user = ADMIN;
    const future = hours(48);
    completed({ deadline: ts(future) });
    await reviewTask({}, fd({ taskId: "t1", decision: "changes", reviewNote: "tweak" }));
    const dl = (doc("tasks/t1")!.deadline as { toDate(): Date }).toDate();
    expect(dl.getTime()).toBe(future.getTime());
  });

  it("reject on a past-deadline task also grants the 24h window", async () => {
    authState.user = ADMIN;
    completed({ deadline: ts(hours(-2)) });
    await reviewTask({}, fd({ taskId: "t1", decision: "reject", reviewNote: "redo" }));
    const dl = (doc("tasks/t1")!.deadline as { toDate(): Date }).toDate();
    expect(dl.getTime()).toBeGreaterThan(Date.now());
  });

  it("review note is truncated at 500 chars", async () => {
    authState.user = ADMIN;
    completed();
    await reviewTask(
      {},
      fd({ taskId: "t1", decision: "changes", reviewNote: "y".repeat(600) })
    );
    expect((doc("tasks/t1")!.reviewNote as string).length).toBe(500);
  });
});

/* ================================================================== */
/* updateTask edge cases                                               */
/* ================================================================== */
describe("updateTask edge cases", () => {
  it("rejects missing required fields", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    const res = await updateTask({}, fd({ taskId: "t1", topic: "x" }));
    expect(res.error).toContain("required");
  });

  it("rejects an unknown status", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    const res = await updateTask({}, validEdit({ status: "DONE" }));
    expect(res.error).toBe("Invalid status.");
  });

  it("rejects slide counts outside 1–99", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    expect((await updateTask({}, validEdit({ taskType: "Carousel", slideCount: "0" }))).error).toContain("1 and 99");
    expect((await updateTask({}, validEdit({ taskType: "Carousel", slideCount: "100" }))).error).toContain("1 and 99");
    expect((await updateTask({}, validEdit({ taskType: "Carousel", slideCount: "abc" }))).error).toContain("1 and 99");
  });

  it("rejects negative pay for admin", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    const res = await updateTask({}, validEdit({ payAmount: "-5" }));
    expect(res.error).toContain("valid number");
  });

  it("rejects an invalid deadline", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    const res = await updateTask({}, validEdit({ deadline: "not-a-date" }));
    expect(res.error).toContain("Invalid deadline");
  });

  it("storing slideCount=null on non-Carousel types", async () => {
    authState.user = ADMIN;
    seedTask("t1", { type: "Carousel", slideCount: 8 });
    await updateTask({}, validEdit({ taskType: "Video Edit", slideCount: "8" }));
    expect(doc("tasks/t1")!.slideCount).toBeNull();
  });

  it("admin clearing the pay field resets it to base rate", async () => {
    authState.user = ADMIN;
    seedTask("t1", { payAmount: 700, payStatus: "APPROVED" });
    await updateTask({}, validEdit({ payAmount: "" }));
    expect(doc("tasks/t1")!.payAmount).toBeNull();
    expect(doc("tasks/t1")!.payStatus).toBe("NONE");
  });

  it("marking a task COMPLETED via edit stamps completedAt once", async () => {
    authState.user = ADMIN;
    seedTask("t1");
    await updateTask({}, validEdit({ status: "COMPLETED" }));
    const first = (doc("tasks/t1")!.completedAt as { toDate(): Date }).toDate();
    expect(first).toBeTruthy();
    // second edit keeps the original stamp
    await updateTask({}, validEdit({ status: "COMPLETED", topic: "renamed" }));
    const second = (doc("tasks/t1")!.completedAt as { toDate(): Date }).toDate();
    expect(second.getTime()).toBe(first.getTime());
  });

  it("MISSED→COMPLETED via edit removes the strike", async () => {
    authState.user = ADMIN;
    seedEmployee("emp1", 1);
    seedTask("t1", { status: "MISSED" });
    await updateTask({}, validEdit({ status: "COMPLETED" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });

  it("edits on a ghost task → Task not found", async () => {
    authState.user = ADMIN;
    const res = await updateTask({}, validEdit({ taskId: "ghost" }));
    expect(res.error).toBe("Task not found.");
  });
});

/* ================================================================== */
/* reviewTaskPay edge cases                                            */
/* ================================================================== */
describe("reviewTaskPay edge cases", () => {
  it("unknown mode → no change", async () => {
    authState.user = ADMIN;
    seedTask("t1", { payAmount: 800, payStatus: "PENDING" });
    await reviewTaskPay(fd({ taskId: "t1", mode: "hmm" }));
    expect(doc("tasks/t1")!.payStatus).toBe("PENDING");
  });

  it("approve with a non-numeric amount → no change", async () => {
    authState.user = ADMIN;
    seedTask("t1", { payAmount: 800, payStatus: "PENDING" });
    await reviewTaskPay(fd({ taskId: "t1", mode: "approve", amount: "abc" }));
    expect(doc("tasks/t1")!.payStatus).toBe("PENDING");
  });

  it("approve with an empty amount falls back to the quoted amount", async () => {
    authState.user = ADMIN;
    seedTask("t1", { payAmount: 800, payStatus: "PENDING" });
    await reviewTaskPay(fd({ taskId: "t1", mode: "approve", amount: "" }));
    expect(doc("tasks/t1")!.payAmount).toBe(800);
    expect(doc("tasks/t1")!.payStatus).toBe("APPROVED");
  });
});

/* ================================================================== */
/* waiveMiss edge cases                                                */
/* ================================================================== */
describe("waiveMiss edge cases", () => {
  it("waiving at 0 strikes stays 0, never negative", async () => {
    authState.user = MANAGER;
    seedEmployee("emp1", 0);
    await waiveMiss(fd({ userId: "emp1", mode: "one" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });

  it("ghost user → no crash, no write", async () => {
    authState.user = MANAGER;
    await waiveMiss(fd({ userId: "ghost", mode: "one" }));
    expect(doc("users/ghost")).toBeUndefined();
  });
});

/* ================================================================== */
/* addTaskRequest edge cases                                           */
/* ================================================================== */
describe("addTaskRequest edge cases", () => {
  it("empty message → error", async () => {
    seedTask("t1");
    const res = await addTaskRequest({}, fd({ taskId: "t1", message: "  " }));
    expect(res.error).toContain("need");
  });

  it("requests are closed on MISSED tasks", async () => {
    seedTask("t1", { status: "MISSED" });
    const res = await addTaskRequest({}, fd({ taskId: "t1", message: "help" }));
    expect(res.error).toContain("no longer active");
  });

  it("requests are closed on COMPLETED tasks", async () => {
    seedTask("t1", { status: "COMPLETED" });
    const res = await addTaskRequest({}, fd({ taskId: "t1", message: "help" }));
    expect(res.error).toContain("no longer active");
  });

  it("exactly-at-6h boundary is closed", async () => {
    seedTask("t1", { deadline: ts(hours(5.9)) });
    const res = await addTaskRequest({}, fd({ taskId: "t1", message: "x" }));
    expect(res.error).toContain("6 hours");
  });

  it("just over 6h is allowed", async () => {
    seedTask("t1", { deadline: ts(hours(7)) });
    const res = await addTaskRequest({}, fd({ taskId: "t1", message: "x" }));
    expect(res.success).toBeTruthy();
  });

  it("ghost task → Task not found", async () => {
    const res = await addTaskRequest({}, fd({ taskId: "ghost", message: "x" }));
    expect(res.error).toBe("Task not found.");
  });
});

/* ================================================================== */
/* deleteRequest edge cases                                            */
/* ================================================================== */
describe("deleteRequest edge cases", () => {
  it("deletes the employee's own request", async () => {
    seedTask("t1");
    seed("taskRequests/r1", { taskId: "t1", message: "x", status: "OPEN" });
    await deleteRequest(fd({ requestId: "r1" }));
    expect(doc("taskRequests/r1")).toBeUndefined();
  });

  it("cannot delete a request on someone else's task", async () => {
    seedTask("t1"); // belongs to emp1
    seed("taskRequests/r1", { taskId: "t1", message: "x", status: "OPEN" });
    authState.user = OTHER_EMPLOYEE;
    await deleteRequest(fd({ requestId: "r1" }));
    expect(doc("taskRequests/r1")).toBeTruthy(); // still there
  });
});

/* ================================================================== */
/* createTask edge cases                                               */
/* ================================================================== */
describe("createTask edge cases", () => {
  it("rejects an invalid deadline string", async () => {
    authState.user = ADMIN;
    const res = await createTask({}, validCreate({ deadline: "banana" }));
    expect(res.error).toContain("Invalid deadline");
  });

  it("rejects bad slide counts on Carousel", async () => {
    authState.user = ADMIN;
    expect((await createTask({}, validCreate({ taskType: "Carousel", slideCount: "0" }))).error).toContain("1 and 99");
    expect((await createTask({}, validCreate({ taskType: "Carousel", slideCount: "xyz" }))).error).toContain("1 and 99");
  });

  it("rejects negative pay", async () => {
    authState.user = ADMIN;
    const res = await createTask({}, validCreate({ payAmount: "-1" }));
    expect(res.error).toContain("valid number");
  });

  it("a past deadline still creates the task — it flags MISSED on next scan", async () => {
    authState.user = ADMIN;
    seedClient();
    seedEmployee();
    await createTask({}, validCreate({ deadline: "2020-01-01T10:00" }));
    expect(doc("tasks/auto-1")!.status).toBe("PENDING");
    await checkMissedDeadlines();
    expect(doc("tasks/auto-1")!.status).toBe("MISSED");
  });
});

/* ================================================================== */
/* checkMissedDeadlines edge cases                                     */
/* ================================================================== */
describe("checkMissedDeadlines edge cases", () => {
  it("multiple overdue tasks for one employee → one strike each", async () => {
    seedEmployee();
    seedTask("a", { deadline: ts(hours(-1)) });
    seedTask("b", { deadline: ts(hours(-2)) });
    seedTask("c", { deadline: ts(hours(-3)) });
    await checkMissedDeadlines();
    expect(doc("users/emp1")!.missedDeadlines).toBe(3);
  });

  it("overdue tasks across two employees → strikes stay separated", async () => {
    seedEmployee("emp1");
    seedEmployee("emp2");
    seedTask("a", { deadline: ts(hours(-1)), assignedToId: "emp1" });
    seedTask("b", { deadline: ts(hours(-1)), assignedToId: "emp2" });
    await checkMissedDeadlines();
    expect(doc("users/emp1")!.missedDeadlines).toBe(1);
    expect(doc("users/emp2")!.missedDeadlines).toBe(1);
  });

  it("empty board → no writes, no crash", async () => {
    await checkMissedDeadlines();
    expect(doc("users/emp1")).toBeUndefined();
  });
});

/* ================================================================== */
/* parseClientRequirements edge cases                                  */
/* ================================================================== */
describe("parseClientRequirements edge cases", () => {
  const reqFd = (reqs: unknown[]) => fd({ requirementsJson: JSON.stringify(reqs) });

  it("drops rows with no type or zero qty", () => {
    const out = parseClientRequirements(
      reqFd([
        { type: "Static Post", qty: 5, per: "WEEK" },
        { type: "", qty: 3, per: "WEEK" },
        { type: "Reel", qty: 0, per: "WEEK" },
      ])
    );
    expect(out).toEqual([{ type: "Static Post", qty: 5, per: "WEEK" }]);
  });

  it("clamps qty to 1–99 and defaults per to WEEK", () => {
    const out = parseClientRequirements(
      reqFd([
        { type: "A", qty: 500 },
        { type: "B", qty: -3, per: "MONTH" },
      ])
    );
    expect(out[0].qty).toBe(99);
    expect(out[0].per).toBe("WEEK");
    expect(out.filter((r) => r.qty > 0).length).toBe(1); // qty -3 → clamped to 0 → dropped
  });

  it("malformed JSON → empty list, no crash", () => {
    const f = new FormData();
    f.set("requirementsJson", "{not json");
    expect(parseClientRequirements(f)).toEqual([]);
  });

  it("caps at 20 requirement rows", () => {
    const out = parseClientRequirements(
      reqFd(Array.from({ length: 30 }, (_, i) => ({ type: `T${i}`, qty: 1, per: "WEEK" })))
    );
    expect(out.length).toBe(20);
  });

  it("long type names are truncated to 40 chars", () => {
    const out = parseClientRequirements(reqFd([{ type: "x".repeat(60), qty: 1 }]));
    expect(out[0].type.length).toBe(40);
  });
});

/* ================================================================== */
/* Pure helpers — boundaries                                           */
/* ================================================================== */
describe("helper boundaries", () => {
  it("taskPay: NONE status still honours an admin-set amount", () => {
    expect(taskPay({ payAmount: 800, payStatus: "NONE" }, 500)).toBe(800);
    expect(taskPay({ payAmount: 0, payStatus: "APPROVED" }, 500)).toBe(0);
  });

  it("parseISTDateTime rejects impossible dates like Feb 30", () => {
    expect(parseISTDateTime("2026-02-30T18:00")).toBeNull();
    expect(parseISTDateTime("2026-13-01T18:00")).toBeNull();
  });

  it("parseISTDateTime trims surrounding whitespace", () => {
    expect(parseISTDateTime("  2026-10-15T18:00  ")!.toISOString()).toBe(
      "2026-10-15T12:30:00.000Z"
    );
  });

  it("shiftISTDay across month boundaries keeps IST time", () => {
    const d = parseISTDateTime("2026-10-31T09:30")!;
    const moved = shiftISTDay(d, 2026, 10, 5); // Nov 5
    const ist = new Date(moved.getTime() + 5.5 * 36e5);
    expect(ist.getUTCMonth()).toBe(10);
    expect(ist.getUTCDate()).toBe(5);
    expect(ist.getUTCHours()).toBe(9);
    expect(ist.getUTCMinutes()).toBe(30);
  });

  it("clientAssignees: null list + null single → empty", () => {
    expect(clientAssignees({ assignedToIds: null, assignedToId: null })).toEqual([]);
    expect(clientAssignees({})).toEqual([]);
  });

  it("getTaskDetail returns null when the client doc is missing", async () => {
    seedTask("t1"); // client c1 NOT seeded
    expect(await getTaskDetail("t1")).toBeNull();
  });
});
