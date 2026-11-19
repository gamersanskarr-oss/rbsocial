import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
const app = initializeApp({ credential: cert(JSON.parse(readFileSync('service-account.json','utf8'))) });
const auth = getAuth(app); const db = getFirestore(app);
let uid;
try { uid = (await auth.createUser({ email: 'qa-admin@qa.rbs', password: 'QaPass123!', displayName: 'QA Admin' })).uid; }
catch (e) { uid = (await auth.getUserByEmail('qa-admin@qa.rbs')).uid; await auth.updateUser(uid, { password: 'QaPass123!' }); }
await db.collection('users').doc(uid).set({
  name: 'QA Admin', email: 'qa-admin@qa.rbs', role: 'ADMIN', team: null,
  missedDeadlines: 0, perPostPay: null, createdAt: FieldValue.serverTimestamp(),
}, { merge: true });
console.log('qa-admin ->', uid);
