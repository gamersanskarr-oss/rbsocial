/* QA test users — DO NOT DELETE. Created for full-app QA audit.
   Password for all: QaPass123! */
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
const app = initializeApp({ credential: cert(JSON.parse(readFileSync('service-account.json','utf8'))) });
const auth = getAuth(app);
const db = getFirestore(app);

const USERS = [
  { email: 'qa-manager@qa.rbs',   name: 'QA Manager',    role: 'MANAGER',    team: null },
  { email: 'qa-designer@qa.rbs',  name: 'QA Designer',   role: 'EMPLOYEE',   team: 'DESIGN' },
  { email: 'qa-it@qa.rbs',        name: 'QA IT Member',  role: 'EMPLOYEE',   team: 'IT' },
  { email: 'qa-accountant@qa.rbs',name: 'QA Accountant', role: 'ACCOUNTANT', team: null },
];

for (const u of USERS) {
  let uid;
  try {
    const rec = await auth.createUser({ email: u.email, password: 'QaPass123!', displayName: u.name });
    uid = rec.uid;
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      uid = (await auth.getUserByEmail(u.email)).uid;
      await auth.updateUser(uid, { password: 'QaPass123!' });
    } else throw e;
  }
  await db.collection('users').doc(uid).set({
    name: u.name, email: u.email, role: u.role, team: u.team,
    missedDeadlines: 0, perPostPay: u.role === 'EMPLOYEE' ? 250 : null,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('OK', u.role.padEnd(10), u.email, '->', uid);
}
