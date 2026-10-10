import "dotenv/config";
import { initializeApp as initClient } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

const API_KEY = "AIzaSyDC5IadTQ37pzaEJX1f4OWWtCAmdsrRh8s";
const CLIENT_CONFIG = {
  apiKey: API_KEY,
  authDomain: "rbsocial-a77e8.firebaseapp.com",
  projectId: "rbsocial-a77e8",
  appId: "1:21483940401:web:2e00da40e25395972c0310",
};

const DEMO = [
  { email: "admin@pixeldesk.com", password: "admin123", role: "ADMIN" },
  { email: "manager@pixeldesk.com", password: "manager123", role: "MANAGER" },
  { email: "accountant@pixeldesk.com", password: "accounts123", role: "ACCOUNTANT" },
  { email: "priya@pixeldesk.com", password: "user123", role: "EMPLOYEE" },
  { email: "rahul@pixeldesk.com", password: "user123", role: "EMPLOYEE" },
  { email: "arjun@pixeldesk.com", password: "user123", role: "EMPLOYEE" },
];

const results: { name: string; ok: boolean; detail: string }[] = [];
const record = (name: string, ok: boolean, detail = "") =>
  results.push({ name, ok, detail });

async function main() {
  // ── 1. Firebase Auth: accounts exist + not disabled ──────────────────
  for (const u of DEMO) {
    try {
      const user = await adminAuth.getUserByEmail(u.email);
      record(
        `Auth account exists: ${u.email}`,
        !user.disabled,
        `uid=${user.uid}${user.disabled ? " (DISABLED!)" : ""} emailVerified=${user.emailVerified}`
      );
    } catch {
      record(`Auth account exists: ${u.email}`, false, "NOT FOUND in Firebase Auth");
    }
  }

  // ── 2. Password sign-in via Identity Toolkit REST (proves passwords) ──
  for (const u of DEMO) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: u.email, password: u.password, returnSecureToken: true }),
        }
      );
      const data = (await res.json()) as { idToken?: string; localId?: string; error?: { message?: string } };
      if (res.ok && data.idToken) {
        record(`Password login works: ${u.email}`, true, `uid=${data.localId}`);
        // mint a session cookie for the HTTP route tests later
        const cookie = await adminAuth.createSessionCookie(data.idToken, {
          expiresIn: 60 * 60 * 1000,
        });
        console.log(`SESSION_COOKIE ${u.role} ${cookie}`);
      } else {
        record(`Password login works: ${u.email}`, false, data.error?.message ?? "unknown error");
      }
    } catch (e) {
      record(`Password login works: ${u.email}`, false, String(e));
    }
  }

  // wrong password must FAIL
  {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@pixeldesk.com",
          password: "wrongpass",
          returnSecureToken: true,
        }),
      }
    );
    record("Wrong password is rejected", !res.ok, res.ok ? "SECURITY HOLE: wrong password accepted" : "rejected as expected");
  }

  // ── 3. Firestore: collection counts ──────────────────────────────────
  const collections = [
    "users",
    "clients",
    "clientAssets",
    "tasks",
    "taskRequests",
    "clientPayments",
    "expenses",
    "subscriptions",
    "dharamDisbursements",
    "settings",
    "activityLog",
  ];
  for (const c of collections) {
    const snap = await adminDb.collection(c).get();
    record(`Firestore collection "${c}" readable`, true, `${snap.size} doc(s)`);
  }

  // ── 4. Data integrity ────────────────────────────────────────────────
  const usersSnap = await adminDb.collection("users").get();
  const clientsSnap = await adminDb.collection("clients").get();
  const tasksSnap = await adminDb.collection("tasks").get();
  const paymentsSnap = await adminDb.collection("clientPayments").get();

  const userIds = new Set(usersSnap.docs.map((d) => d.id));
  const clientIds = new Set(clientsSnap.docs.map((d) => d.id));

  let badRole = 0;
  usersSnap.docs.forEach((d) => {
    const role = d.data().role;
    if (!["ADMIN", "MANAGER", "ACCOUNTANT", "EMPLOYEE"].includes(role)) badRole++;
  });
  record("Every user doc has a valid role", badRole === 0, `${usersSnap.size} users checked`);

  let badTaskRefs = 0;
  tasksSnap.docs.forEach((d) => {
    const t = d.data();
    if (t.clientId && !clientIds.has(String(t.clientId))) badTaskRefs++;
    if (t.assignedToId && !userIds.has(String(t.assignedToId))) badTaskRefs++;
  });
  record("Every task references a real client + user", badTaskRefs === 0, `${tasksSnap.size} tasks checked`);

  let badPayRefs = 0;
  paymentsSnap.docs.forEach((d) => {
    if (!clientIds.has(String(d.data().clientId))) badPayRefs++;
  });
  record("Every payment references a real client", badPayRefs === 0, `${paymentsSnap.size} payments checked`);

  const clientsWithBilling = clientsSnap.docs.filter(
    (d) => d.data().monthlyFee != null && d.data().billingDay != null
  ).length;
  record("Clients have billing fields (fee + billing day)", clientsWithBilling > 0, `${clientsWithBilling}/${clientsSnap.size} clients`);

  // ── 5. WRITE PROOF: create → read → delete a test doc ────────────────
  try {
    const ref = adminDb.collection("_selftest").doc("write-proof");
    await ref.set({ msg: "write test", at: new Date().toISOString() });
    const back = await ref.get();
    record("Firestore WRITE works (set → read → delete)", back.exists && back.data()?.msg === "write test");
    await ref.delete();
    const gone = await ref.get();
    record("Firestore DELETE works", !gone.exists);
  } catch (e) {
    record("Firestore WRITE works", false, String(e));
  }

  // ── 6. SECURITY: client-side Firestore must be DENIED (no auth) ──────
  try {
    const app = initClient(CLIENT_CONFIG);
    const db = getFirestore(app);
    await getDocs(collection(db, "users"));
    record("Client-side Firestore blocked by rules", false, "SECURITY HOLE: anonymous client read SUCCEEDED — rules are open!");
  } catch (e) {
    const msg = String(e);
    const denied = msg.includes("permission-denied") || msg.includes("insufficient permissions");
    record("Client-side Firestore blocked by rules", denied, denied ? "permission-denied (rules locked down)" : `unexpected error: ${msg.slice(0, 120)}`);
  }

  // ── Report ───────────────────────────────────────────────────────────
  console.log("\n════════════ VERIFICATION REPORT ══════════");
  let pass = 0, fail = 0;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  — " + r.detail : ""}`);
    if (r.ok) pass++;
    else fail++;
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
