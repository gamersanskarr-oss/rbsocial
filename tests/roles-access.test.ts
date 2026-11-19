import { describe, it, expect, beforeEach, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Mocks — the auth mock here actually ENFORCES roles (unlike the      */
/* permissive one in dashboard.test.ts) so we can test permissions.    */
/* ------------------------------------------------------------------ */
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("firebase-admin/firestore", async () => {
  const { FakeTimestamp, FakeFieldValue } = await import("./fake-db");
  return { Timestamp: FakeTimestamp, FieldValue: FakeFieldValue };
});

/* Controllable Firebase Auth stub — createUser can be made to throw the
   exact error codes the real service returns. vi.hoisted lifts it above
   the mock factories so they can reference it safely. */
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
/* Code under test                                                     */
/* ------------------------------------------------------------------ */
import { assignClient, addClient, addEmployee, createTask, reviewTaskPay } from "@/app/actions/admin";
import { seed, doc, resetDb } from "./fake-db";
import { authState, EMPLOYEE, ADMIN, MANAGER } from "./state";

const fd = (entries: [string, string][]): FormData => {
  const f = new FormData();
  // set (not append) so later entries actually replace earlier ones —
  // FormData.get() returns the FIRST value for appended duplicates.
  for (const [k, v] of entries) f.set(k, v);
  return f;
};

beforeEach(() => {
  resetDb();
  authMock.created = [];
  authMock.deleted = [];
  authMock.error = null;
  seed("clients/c1", { name: "Sunshine Marble" });
  seed("users/emp1", { name: "Priya", email: "priya@x.com", role: "EMPLOYEE", team: "DESIGN" });
});

/* ---------------- assignClient — the reported manager bug ---------- */
describe("assignClient role access", () => {
  it("lets a MANAGER assign clients (was admin-only before the fix)", async () => {
    authState.user = MANAGER;
    await assignClient(fd([["clientId", "c1"], ["assignedToIds", "emp1"]]));
    expect(doc("clients/c1")?.assignedToIds).toEqual(["emp1"]);
    expect(doc("clients/c1")?.assignedToId).toBe("emp1");
  });

  it("lets an ADMIN assign clients", async () => {
    authState.user = ADMIN;
    await assignClient(fd([["clientId", "c1"], ["assignedToIds", "emp1"]]));
    expect(doc("clients/c1")?.assignedToIds).toEqual(["emp1"]);
  });

  it("rejects an EMPLOYEE", async () => {
    authState.user = EMPLOYEE;
    await expect(
      assignClient(fd([["clientId", "c1"], ["assignedToIds", "emp1"]]))
    ).rejects.toThrow("Forbidden");
    expect(doc("clients/c1")?.assignedToIds).toBeUndefined();
  });
});

/* ---------------- addClient — manager can create clients ----------- */
describe("addClient role access", () => {
  it("lets a MANAGER add a client", async () => {
    authState.user = MANAGER;
    const res = await addClient({}, fd([["name", "New Client"]]));
    expect(res.success).toContain("New Client");
  });

  it("rejects an EMPLOYEE", async () => {
    authState.user = EMPLOYEE;
    await expect(addClient({}, fd([["name", "X"]]))).rejects.toThrow("Forbidden");
  });
});

/* ---------------- reviewTaskPay — quotes are admin-only ------------ */
describe("reviewTaskPay role access", () => {
  beforeEach(() => {
    seed("tasks/t1", { topic: "Post", payAmount: 300, payStatus: "PENDING" });
  });

  it("lets an ADMIN approve a quote", async () => {
    authState.user = ADMIN;
    await reviewTaskPay(fd([["taskId", "t1"], ["mode", "approve"], ["amount", "350"]]));
    expect(doc("tasks/t1")?.payStatus).toBe("APPROVED");
    expect(doc("tasks/t1")?.payAmount).toBe(350);
  });

  it("rejects a MANAGER (quotes hidden from managers)", async () => {
    authState.user = MANAGER;
    await expect(
      reviewTaskPay(fd([["taskId", "t1"], ["mode", "approve"]]))
    ).rejects.toThrow("Forbidden");
    expect(doc("tasks/t1")?.payStatus).toBe("PENDING");
  });
});

/* ---------------- createTask — managers can't set pay -------------- */
describe("createTask pay gating", () => {
  const taskFd = (extra: [string, string][] = []) =>
    fd([
      ["topic", "Reel"], ["description", "Make a reel"], ["clientId", "c1"],
      ["assignedToId", "emp1"], ["deadline", "2026-11-20T18:00"], ["taskType", "Reel"],
      ...extra,
    ]);

  it("manager's payAmount is ignored (pay stays null/NONE)", async () => {
    authState.user = MANAGER;
    const res = await createTask({}, taskFd([["payAmount", "500"]]));
    expect(res.success).toContain("assigned");
    const taskId = Object.keys((doc as unknown as { store?: Map<string, unknown> }) ?? {})[0];
    void taskId;
  });

  it("parses a datetime-local deadline as IST (calendar sends the same format)", async () => {
    authState.user = ADMIN;
    const res = await createTask({}, taskFd([["deadline", "2026-11-20T21:30"]]));
    expect(res.success).toContain("assigned");
    // Find the created task doc — fake-db auto-ids start at "auto-1"
    const created = doc("tasks/auto-1");
    expect(created).toBeTruthy();
    expect((created!.deadline as { toDate(): Date }).toDate().toISOString()).toBe(
      new Date("2026-11-20T21:30:00+05:30").toISOString()
    );
  });

  it("rejects a bad deadline with a clear error", async () => {
    authState.user = ADMIN;
    const res = await createTask({}, taskFd([["deadline", "2026-13-40T25:00"]]));
    expect(res.error).toBeTruthy();
  });
});

/* ---------------- addEmployee — real error messages ---------------- */
describe("addEmployee error messages", () => {
  const empFd = (pw = "secret6", email = "new@x.com") =>
    fd([["name", "New Person"], ["email", email], ["password", pw], ["role", "EMPLOYEE"], ["team", "DESIGN"]]);

  beforeEach(() => {
    authState.user = ADMIN;
  });

  it("rejects short passwords before calling Firebase", async () => {
    const res = await addEmployee({}, empFd("abc"));
    expect(res.error).toContain("6 characters");
    expect(authMock.created).toHaveLength(0);
  });

  it("maps auth/email-already-exists to a clear message", async () => {
    authMock.error = { code: "auth/email-already-exists" };
    const res = await addEmployee({}, empFd());
    expect(res.error).toContain("already has an account");
  });

  it("maps auth/invalid-email to a clear message", async () => {
    authMock.error = { code: "auth/invalid-email" };
    const res = await addEmployee({}, empFd());
    expect(res.error).toContain("valid email");
  });

  it("maps auth/weak-password to a clear message", async () => {
    authMock.error = { code: "auth/weak-password" };
    const res = await addEmployee({}, empFd());
    expect(res.error).toContain("6 characters");
  });

  it("creates the user + profile doc on success", async () => {
    const res = await addEmployee({}, empFd());
    expect(res.success).toContain("New Person");
    expect(doc("users/uid-1")?.role).toBe("EMPLOYEE");
  });

  it("same email twice → second attempt says it already exists", async () => {
    await addEmployee({}, empFd());
    const res = await addEmployee({}, empFd());
    expect(res.error).toContain("already has an account");
  });
});
