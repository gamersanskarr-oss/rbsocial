import "dotenv/config";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

/**
 * Full data wipe — deletes every document in every collection and every
 * Firebase Auth user EXCEPT the keep-list accounts below, whose Auth
 * accounts and users/{uid} profile docs are preserved (or recreated if
 * missing) so those logins keep working.
 *
 * Run: npx tsx scripts/wipe.ts
 */

const KEEP = new Map([
  ["gamersanskarr@gmail.com", { name: "Sanskar", role: "ADMIN" }],
]);

const COLLECTIONS = [
  "users",
  "clients",
  "clientAssets",
  "tasks",
  "taskRequests",
  "clientPayments",
  "expenses",
  "subscriptions",
  "dharamDisbursements",
  "activityLog",
  "sharedReports",
  "settings",
  "jobs",
  "jobApplications",
];

async function deleteCollection(name: string, keepDocIds = new Set<string>()) {
  let deleted = 0;
  for (;;) {
    const snap = await adminDb.collection(name).limit(400).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    let n = 0;
    for (const doc of snap.docs) {
      if (keepDocIds.has(doc.id)) continue;
      batch.delete(doc.ref);
      n++;
      deleted++;
    }
    if (n === 0) break; // only keep-docs left
    await batch.commit();
  }
  console.log(`  ${name}: ${deleted} deleted`);
}

async function main() {
  console.log("Wiping — keeping:", [...KEEP.keys()].join(", "));

  // 1. Resolve keep accounts first — get or create their Auth users.
  const keepUids = new Set<string>();
  const keepUidByEmail = new Map<string, string>();
  for (const [email, info] of KEEP) {
    let uid: string;
    try {
      uid = (await adminAuth.getUserByEmail(email)).uid;
    } catch {
      // Password comes from the env or a generated random — never hardcoded.
      const password =
        process.env.WIPE_ADMIN_PASSWORD ??
        Math.random().toString(36).slice(2) + "!" + Date.now().toString(36);
      uid = (
        await adminAuth.createUser({
          email,
          password,
          displayName: info.name,
        })
      ).uid;
      console.log(`  created missing Auth user: ${email} (password: ${password})`);
    }
    keepUids.add(uid);
    keepUidByEmail.set(email, uid);
  }

  // 2. Delete every other Auth account.
  let authDeleted = 0;
  let pageToken: string | undefined;
  do {
    const res = await adminAuth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if (keepUids.has(u.uid)) continue;
      await adminAuth.deleteUser(u.uid);
      authDeleted++;
    }
    pageToken = res.pageToken;
  } while (pageToken);
  console.log(`\nAuth users deleted: ${authDeleted} (kept ${keepUids.size})`);

  // 3. Wipe Firestore collections (keep the two user profile docs).
  console.log("\nFirestore:");
  for (const name of COLLECTIONS) {
    await deleteCollection(name, name === "users" ? keepUids : new Set());
  }

  // 4. Ensure the kept accounts still have profile docs (recreate if they
  //    were missing so login never breaks).
  for (const [email, info] of KEEP) {
    const uid = keepUidByEmail.get(email)!;
    const ref = adminDb.collection("users").doc(uid);
    if (!(await ref.get()).exists) {
      await ref.set({
        name: info.name,
        email,
        role: info.role,
        team: null,
        missedDeadlines: 0,
        perPostPay: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`  recreated profile doc: ${email}`);
    }
  }

  console.log("\nDone — database is clean. Admin + Manager logins still work.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
