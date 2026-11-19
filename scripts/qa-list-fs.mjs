import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
const app = initializeApp({ credential: cert(JSON.parse(readFileSync('service-account.json','utf8'))) });
const db = getFirestore(app);
for (const coll of ['users','clients','tasks','clientPayments','expenses','taskRequests','jobs','subscriptions','dharamDisbursements','jobApplications','sharedReports','activityLog']) {
  const snap = await db.collection(coll).get();
  console.log(`\n=== ${coll} (${snap.size}) ===`);
  for (const d of snap.docs.slice(0, 15)) {
    const x = d.data();
    console.log(d.id, '|', JSON.stringify(x).slice(0, 160));
  }
}
