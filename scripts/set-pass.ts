import "dotenv/config";
import { adminAuth } from "../src/lib/firebase-admin";

/**
 * Reset any user's password. Usage:
 *   npx tsx scripts/set-pass.ts <email> <newPassword>
 */
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/set-pass.ts <email> <newPassword>");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }
  const u = await adminAuth.getUserByEmail(email);
  await adminAuth.updateUser(u.uid, { password });
  // Kill all existing sessions so the old password can't linger anywhere.
  await adminAuth.revokeRefreshTokens(u.uid);
  console.log(`password reset for ${email} — all sessions logged out`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
