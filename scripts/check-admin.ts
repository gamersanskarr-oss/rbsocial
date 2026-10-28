import "dotenv/config";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

async function main() {
  const u = await adminAuth.getUserByEmail("gamersanskarr@gmail.com");
  console.log("auth user:", u.uid, "| disabled:", u.disabled);
  const doc = await adminDb.collection("users").doc(u.uid).get();
  console.log("profile doc:", doc.exists ? doc.data() : "MISSING");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
