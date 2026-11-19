import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
const app = initializeApp({ credential: cert(JSON.parse(readFileSync('service-account.json','utf8'))) });
const auth = getAuth(app);
const list = await auth.listUsers(50);
for (const u of list.users) console.log(u.uid, '|', u.email, '|', u.displayName);
console.log('TOTAL:', list.users.length);
