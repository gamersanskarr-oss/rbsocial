import { describe, it, expect, beforeEach, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Module mocks — everything except the REAL app code under test      */
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
import { checkMissedDeadlines, payoutStatus, MISSED_DEADLINE_LIMIT } from "@/lib/deadlines";
import {
  submitTask,
  submitMissReason,
  moveTaskDeadline,
  reviewTask,
  updateTask,
} from "@/app/actions/tasks";
import { createTask, reviewTaskPay, waiveMiss } from "@/app/actions/admin";
import { addTaskRequest, resolveRequest } from "@/app/actions/requests";
import {
  taskPay,
  parseISTDateTime,
  shiftISTDay,
  clientAssignees,
  overduePendingTasks,
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
    name: "Priya Sharma",
    email: "priya@x",
    role: "EMPLOYEE",
    team: "DESIGN",
    missedDeadlines: missed,
    perPostPay: 500,
    createdAt: ts(new Date("2026-01-01")),
  });

const seedClient = (id = "c1") =>
  seed(`clients/${id}`, {
    name: "Acme Cafe",
    assignedToIds: ["emp1"],
    assignedToId: "emp1",
    createdAt: ts(new Date("2026-01-01")),
  });

const seedTask = (id: string, over: Record<string, unknown> = {}) =>
  seed(`tasks/${id}`, {
    topic: "Diwali post",
    description: "Make a festive static",
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

beforeEach(() => {
  resetDb();
  authState.user = EMPLOYEE;
});

/* ================================================================== */
/* 1. Missed-deadline flagging                                         */
/* ================================================================== */
describe("missed deadline detection", () => {
  it("flags an overdue PENDING task as MISSED and bumps the employee's strike", async () => {
    seedEmployee();
    seedTask("t1", { deadline: ts(hours(-2)) });
    seedTask("t2", { deadline: ts(hours(48)) }); // future — untouched
    seedTask("t3", { deadline: ts(hours(-5)), status: "COMPLETED" }); // done — untouched

    await checkMissedDeadlines();

    expect(doc("tasks/t1")!.status).toBe("MISSED");
    expect(doc("users/emp1")!.missedDeadlines).toBe(1);
    expect(doc("tasks/t2")!.status).toBe("PENDING");
    expect(doc("tasks/t3")!.status).toBe("COMPLETED");
  });

  it("does not double-count on a second run", async () => {
    seedEmployee();
    seedTask("t1", { deadline: ts(hours(-1)) });
    await checkMissedDeadlines();
    await checkMissedDeadlines();
    expect(doc("users/emp1")!.missedDeadlines).toBe(1);
  });

  it("overduePendingTasks only returns what is past due", async () => {
    seedTask("old", { deadline: ts(hours(-1)) });
    seedTask("new", { deadline: ts(hours(10)) });
    const overdue = await overduePendingTasks();
    expect(overdue.map((t) => t.id)).toEqual(["old"]);
  });
});

/* ================================================================== */
/* 2. Employee submission                                              */
/* ================================================================== */
describe("employee task submission", () => {
  it("marks a pending task COMPLETED, stores the link and queues it for review", async () => {
    seedEmployee();
    seedTask("t1");
    const res = await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "https://canva.com/x", payAmount: "500" })
    );
    expect(res.success).toBeTruthy();
    const t = doc("tasks/t1")!;
    expect(t.status).toBe("COMPLETED");
    expect(t.submissionLink).toBe("https://canva.com/x");
    expect(t.approval).toBe("PENDING");
    expect(t.lateSubmission).toBe(false);
  });

  it("rejects an invalid submission link", async () => {
    seedTask("t1");
    const res = await submitTask({}, fd({ taskId: "t1", submissionLink: "not-a-url" }));
    expect(res.error).toContain("valid URL");
    expect(doc("tasks/t1")!.status).toBe("PENDING");
  });

  it("blocks submissions on someone else's task", async () => {
    seedTask("t1");
    authState.user = OTHER_EMPLOYEE;
    const res = await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "https://canva.com/x" })
    );
    expect(res.error).toBe("Task not found.");
  });

  it("a custom quote goes to PENDING until approved", async () => {
    seedTask("t1");
    await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "https://canva.com/x", payAmount: "800" })
    );
    const t = doc("tasks/t1")!;
    expect(t.payAmount).toBe(800);
    expect(t.payStatus).toBe("PENDING");
  });
});

/* ================================================================== */
/* 3. Missed task → late submission + reason                           */
/* ================================================================== */
describe("missed task flow", () => {
  it("employee can still submit a MISSED task — flagged late, strike kept", async () => {
    seedEmployee("emp1", 1);
    seedTask("t1", { status: "MISSED", deadline: ts(hours(-4)) });
    await submitTask(
      {},
      fd({ taskId: "t1", submissionLink: "https://canva.com/x", payAmount: "500" })
    );
    const t = doc("tasks/t1")!;
    expect(t.status).toBe("COMPLETED");
    expect(t.lateSubmission).toBe(true);
    expect(doc("users/emp1")!.missedDeadlines).toBe(1); // strike stays
  });

  it("employee can attach a delay reason — saved on the task for the manager", async () => {
    seedClient();
    seedTask("t1", { status: "MISSED" });
    const res = await submitMissReason(
      {},
      fd({ taskId: "t1", missReason: "Client sent assets late" })
    );
    expect(res.success).toBeTruthy();
    expect(doc("tasks/t1")!.missReason).toBe("Client sent assets late");
    // and the manager's detail view would read it back via getTaskDetail
    const detail = await getTaskDetail("t1");
    expect(detail!.missReason).toBe("Client sent assets late");
  });

  it("rejects a reason on someone else's task", async () => {
    seedTask("t1");
    authState.user = OTHER_EMPLOYEE;
    const res = await submitMissReason({}, fd({ taskId: "t1", missReason: "x" }));
    expect(res.error).toBe("Task not found.");
  });
});

/* ================================================================== */
/* 4. Drag-reschedule (calendar)                                       */
/* ================================================================== */
describe("moveTaskDeadline (drag & drop)", () => {
  it("moving a task to the past marks it MISSED + adds a strike", async () => {
    seedEmployee();
    seedTask("t1", { deadline: ts(hours(24)) });
    await moveTaskDeadline("t1", isoDay(hours(-48)));
    expect(doc("tasks/t1")!.status).toBe("MISSED");
    expect(doc("users/emp1")!.missedDeadlines).toBe(1);
  });

  it("moving a missed task back to the future restores PENDING + removes the strike", async () => {
    seedEmployee("emp1", 1);
    seedTask("t1", { status: "MISSED", deadline: ts(hours(-4)) });
    await moveTaskDeadline("t1", isoDay(hours(72)));
    expect(doc("tasks/t1")!.status).toBe("PENDING");
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });

  it("keeps the IST wall-clock time when moving between days", async () => {
    seedEmployee();
    // 18:00 IST = 12:30 UTC
    const dl = parseISTDateTime("2026-10-20T18:00")!;
    seedTask("t1", { deadline: ts(dl) });
    await moveTaskDeadline("t1", "2026-10-25");
    const moved = doc("tasks/t1")!.deadline as { toDate(): Date };
    const ist = new Date(moved.toDate().getTime() + 5.5 * 36e5);
    expect(ist.getUTCHours()).toBe(18);
    expect(ist.getUTCMinutes()).toBe(0);
    expect(ist.getUTCDate()).toBe(25);
  });
});

/* ================================================================== */
/* 5. Submission review — approve / changes / reject                   */
/* ================================================================== */
describe("submission review", () => {
  const completedTask = () =>
    seedTask("t1", {
      status: "COMPLETED",
      submissionLink: "https://canva.com/x",
      completedAt: ts(hours(-1)),
      approval: "PENDING",
    });

  it("approve marks the submission APPROVED", async () => {
    authState.user = MANAGER;
    completedTask();
    const res = await reviewTask(
      {},
      fd({ taskId: "t1", decision: "approve", reviewNote: "Nice work" })
    );
    expect(res.success).toBeTruthy();
    expect(doc("tasks/t1")!.approval).toBe("APPROVED");
    expect(doc("tasks/t1")!.status).toBe("COMPLETED");
  });

  it("changes/reject requires a note", async () => {
    authState.user = MANAGER;
    completedTask();
    const res = await reviewTask({}, fd({ taskId: "t1", decision: "changes" }));
    expect(res.error).toContain("note");
  });

  it("changes reopens the task to PENDING with the reason + a 24h redo window", async () => {
    authState.user = ADMIN;
    completedTask();
    // deadline already passed
    seed(`tasks/t1`, { ...doc("tasks/t1")!, deadline: ts(hours(-3)) });
    const res = await reviewTask(
      {},
      fd({ taskId: "t1", decision: "changes", reviewNote: "Fix the logo size" })
    );
    expect(res.success).toBeTruthy();
    const t = doc("tasks/t1")!;
    expect(t.status).toBe("PENDING");
    expect(t.approval).toBe("CHANGES");
    expect(t.reviewNote).toBe("Fix the logo size");
    const newDl = (t.deadline as { toDate(): Date }).toDate();
    expect(newDl.getTime()).toBeGreaterThan(Date.now());
  });

  it("reject reopens the task with REJECTED + reason", async () => {
    authState.user = MANAGER;
    completedTask();
    await reviewTask(
      {},
      fd({ taskId: "t1", decision: "reject", reviewNote: "Wrong ratio" })
    );
    const t = doc("tasks/t1")!;
    expect(t.status).toBe("PENDING");
    expect(t.approval).toBe("REJECTED");
    expect(t.reviewNote).toBe("Wrong ratio");
  });
});

/* ================================================================== */
/* 6. Task editing (updateTask)                                        */
/* ================================================================== */
describe("task editing", () => {
  const editFd = (over: Record<string, string> = {}) =>
    fd({
      taskId: "t1",
      topic: "New topic",
      description: "Updated brief",
      clientId: "c1",
      assignedToId: "emp1",
      deadline: "2026-11-01T18:00",
      taskType: "Carousel",
      slideCount: "8",
      status: "PENDING",
      referenceLink: "",
      submissionLink: "",
      ...over,
    });

  it("admin can fully edit a task incl. pay", async () => {
    authState.user = ADMIN;
    seedClient();
    seedTask("t1");
    const res = await updateTask({}, editFd({ payAmount: "700" }));
    expect(res.success).toBeTruthy();
    const t = doc("tasks/t1")!;
    expect(t.topic).toBe("New topic");
    expect(t.type).toBe("Carousel");
    expect(t.slideCount).toBe(8);
    expect(t.payAmount).toBe(700);
    expect(t.payStatus).toBe("APPROVED");
    const dl = (t.deadline as { toDate(): Date }).toDate();
    // 18:00 IST stored = 12:30 UTC
    expect(dl.toISOString()).toBe("2026-11-01T12:30:00.000Z");
  });

  it("manager can edit everything EXCEPT pay", async () => {
    authState.user = MANAGER;
    seedClient();
    seedTask("t1", { payAmount: 500, payStatus: "APPROVED" });
    const res = await updateTask({}, editFd({ payAmount: "9999" }));
    expect(res.success).toBeTruthy();
    const t = doc("tasks/t1")!;
    expect(t.topic).toBe("New topic");
    expect(t.payAmount).toBe(500); // untouched
    expect(t.payStatus).toBe("APPROVED");
  });

  it("flipping status to MISSED adds a strike, flipping back removes it", async () => {
    authState.user = ADMIN;
    seedEmployee();
    seedTask("t1");
    await updateTask({}, editFd({ status: "MISSED", taskType: "Static Post" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(1);
    await updateTask({}, editFd({ status: "PENDING", taskType: "Static Post" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });
});

/* ================================================================== */
/* 7. Pay quotes & strikes                                             */
/* ================================================================== */
describe("pay quotes & payout rules", () => {
  it("approve quote sets APPROVED + amount (editable)", async () => {
    authState.user = MANAGER;
    seedTask("t1", { payAmount: 800, payStatus: "PENDING" });
    await reviewTaskPay(fd({ taskId: "t1", mode: "approve", amount: "700" }));
    expect(doc("tasks/t1")!.payStatus).toBe("APPROVED");
    expect(doc("tasks/t1")!.payAmount).toBe(700);
  });

  it("decline quote falls back to base rate", async () => {
    authState.user = MANAGER;
    seedTask("t1", { payAmount: 800, payStatus: "PENDING" });
    await reviewTaskPay(fd({ taskId: "t1", mode: "decline" }));
    expect(doc("tasks/t1")!.payStatus).toBe("NONE");
    expect(doc("tasks/t1")!.payAmount).toBeNull();
  });

  it("taskPay counts pending quotes at base rate, approved at quoted amount", () => {
    expect(taskPay({ payAmount: 800, payStatus: "PENDING" }, 500)).toBe(500);
    expect(taskPay({ payAmount: 800, payStatus: "APPROVED" }, 500)).toBe(800);
    expect(taskPay({ payAmount: null, payStatus: "NONE" }, 500)).toBe(500);
  });

  it("payoutStatus cuts pay at 3+ strikes, keeps it under", () => {
    expect(payoutStatus(2).reduced).toBe(false);
    expect(payoutStatus(MISSED_DEADLINE_LIMIT).reduced).toBe(true);
  });

  it("waiveMiss decrements one strike; 'all' resets", async () => {
    authState.user = MANAGER;
    seedEmployee("emp1", 3);
    await waiveMiss(fd({ userId: "emp1", mode: "one" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(2);
    await waiveMiss(fd({ userId: "emp1", mode: "all" }));
    expect(doc("users/emp1")!.missedDeadlines).toBe(0);
  });
});

/* ================================================================== */
/* 8. Task requests                                                    */
/* ================================================================== */
describe("task requests to admin", () => {
  it("blocks requests when <6h to deadline", async () => {
    seedTask("t1", { deadline: ts(hours(2)) });
    const res = await addTaskRequest(
      {},
      fd({ taskId: "t1", message: "need logo" })
    );
    expect(res.error).toContain("6 hours");
  });

  it("creates an OPEN request the admin can resolve", async () => {
    seedTask("t1", { deadline: ts(hours(48)) });
    const res = await addTaskRequest(
      {},
      fd({ taskId: "t1", message: "need logo" })
    );
    expect(res.success).toBeTruthy();
    const [reqPath] = ["taskRequests/auto-1"];
    expect(doc(reqPath)!.status).toBe("OPEN");

    authState.user = ADMIN;
    await resolveRequest(fd({ requestId: "auto-1" }));
    expect(doc(reqPath)!.status).toBe("RESOLVED");
  });
});

/* ================================================================== */
/* 9. Task creation                                                    */
/* ================================================================== */
describe("task creation", () => {
  const valid = (over: Record<string, string> = {}) =>
    fd({
      topic: "Reel edit",
      description: "Cut a 30s reel",
      clientId: "c1",
      assignedToId: "emp1",
      deadline: "2026-11-05T18:00",
      taskType: "Carousel",
      slideCount: "8",
      referenceLink: "",
      ...over,
    });

  it("requires all core fields", async () => {
    authState.user = ADMIN;
    const res = await createTask({}, fd({ topic: "x" }));
    expect(res.error).toContain("required");
  });

  it("creates a PENDING task, slide count only for Carousel", async () => {
    authState.user = ADMIN;
    seedClient();
    seedEmployee();
    const res = await createTask({}, valid());
    expect(res.success).toBeTruthy();
    const t = doc("tasks/auto-1")!;
    expect(t.status).toBe("PENDING");
    expect(t.slideCount).toBe(8);

    await createTask({}, valid({ taskType: "Video Edit" }));
    expect(doc("tasks/auto-2")!.slideCount).toBeNull();
  });

  it("manager's payAmount is ignored (admin-only)", async () => {
    authState.user = MANAGER;
    seedClient();
    seedEmployee();
    await createTask({}, valid({ payAmount: "999" }));
    expect(doc("tasks/auto-1")!.payAmount).toBeNull();
    expect(doc("tasks/auto-1")!.payStatus).toBe("NONE");
  });

  it("admin-set pay is pre-approved", async () => {
    authState.user = ADMIN;
    seedClient();
    seedEmployee();
    await createTask({}, valid({ payAmount: "999" }));
    expect(doc("tasks/auto-1")!.payAmount).toBe(999);
    expect(doc("tasks/auto-1")!.payStatus).toBe("APPROVED");
  });
});

/* ================================================================== */
/* 10. Pure helpers                                                    */
/* ================================================================== */
describe("helpers", () => {
  it("parseISTDateTime treats bare datetime-local input as IST", () => {
    expect(parseISTDateTime("2026-10-15T18:00")!.toISOString()).toBe(
      "2026-10-15T12:30:00.000Z"
    );
    expect(parseISTDateTime("2026-10-15")!.toISOString()).toBe(
      "2026-10-14T18:30:00.000Z"
    );
    expect(parseISTDateTime("")).toBeNull();
    expect(parseISTDateTime("junk")).toBeNull();
    // zone-aware input is respected as-is
    expect(parseISTDateTime("2026-10-15T18:00:00+00:00")!.toISOString()).toBe(
      "2026-10-15T18:00:00.000Z"
    );
  });

  it("shiftISTDay keeps the wall-clock time across any server timezone", () => {
    const d = parseISTDateTime("2026-10-15T18:00")!;
    const moved = shiftISTDay(d, 2026, 9, 20); // Oct is month index 9
    const ist = new Date(moved.getTime() + 5.5 * 36e5);
    expect(ist.getUTCDate()).toBe(20);
    expect(ist.getUTCHours()).toBe(18);
  });

  it("clientAssignees prefers the list, falls back to legacy single id", () => {
    expect(clientAssignees({ assignedToIds: ["a", "b"], assignedToId: "a" })).toEqual([
      "a",
      "b",
    ]);
    expect(clientAssignees({ assignedToIds: null, assignedToId: "a" })).toEqual(["a"]);
    expect(clientAssignees({ assignedToIds: [], assignedToId: null })).toEqual([]);
  });
});
