import "dotenv/config";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

/**
 * Fully remove one user — Auth account + users/{uid} profile doc. Usage:
 *   npx tsx scripts/del-user.ts <email>
 */
async function main() {
  const [email] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npx tsx scripts/del-user.ts <email>");
    process.exit(1);
  }
  const u = await adminAuth.getUserByEmail(email);
  await adminDb.collection("users").doc(u.uid).delete();
  await adminAuth.deleteUser(u.uid);
  console.log("deleted:", email, u.uid);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
