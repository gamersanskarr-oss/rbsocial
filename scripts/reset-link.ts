import "dotenv/config";
import { adminAuth } from "../src/lib/firebase-admin";

/**
 * Generate a password-reset link directly (no email needed). Usage:
 *   npx tsx scripts/reset-link.ts <email>
 * Open the printed URL in a browser → set a new password.
 */
async function main() {
  const [email] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-link.ts <email>");
    process.exit(1);
  }
  const link = await adminAuth.generatePasswordResetLink(email);
  console.log("\nOpen this link to reset the password:\n");
  console.log(link);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
