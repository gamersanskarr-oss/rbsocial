import "dotenv/config";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

/**
 * Create (or repair) an ADMIN user. Usage:
 *   npx tsx scripts/make-admin.ts <email> <password> [name]
 * Password never lives in this file — it comes from your command line.
 */
async function main() {
  const [email, password, name = "Admin"] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email> <password> [name]");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  let uid: string;
  try {
    uid = (await adminAuth.getUserByEmail(email)).uid;
    console.log("auth user already existed:", uid);
  } catch {
    uid = (await adminAuth.createUser({ email, password, displayName: name })).uid;
    console.log("auth user created:", uid);
  }

  await adminDb.collection("users").doc(uid).set({
    name,
    email,
    role: "ADMIN",
    team: null,
    missedDeadlines: 0,
    perPostPay: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`admin profile written — ${email} can now log in`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
