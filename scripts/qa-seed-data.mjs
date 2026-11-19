/* QA test data — DO NOT DELETE. */
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
const app = initializeApp({ credential: cert(JSON.parse(readFileSync('service-account.json','utf8'))) });
const db = getFirestore(app);
const DESIGNER = 'bkBKnCGKlFbTOkzR75qV8crqzPs2'; // qa-designer@qa.rbs

const client = await db.collection('clients').add({
  name: 'QA Test Client Ltd', contact: 'qa-contact', phone: null,
  instagram: null, facebook: null, website: null, logoUrl: null, notes: 'QA seed record',
  requirements: [{ type: 'Static Post', qty: 4, per: 'WEEK' }],
  assignedToId: DESIGNER, assignedToIds: [DESIGNER],
  status: 'ACTIVE', billingDay: 5, billingModel: 'PREPAID', monthlyFee: 12000,
  feeEffectiveFrom: null, previousMonthlyFee: null,
  createdAt: FieldValue.serverTimestamp(),
});
console.log('client:', client.id);

const task = await db.collection('tasks').add({
  topic: 'QA Diwali poster', description: 'QA seeded task for E2E testing',
  type: 'Static Post', slideCount: null, payAmount: null, payStatus: 'NONE',
  clientId: client.id, assignedToId: DESIGNER,
  deadline: Timestamp.fromDate(new Date(Date.now() + 48 * 3600e3)),
  status: 'PENDING', approval: 'NONE', reviewNote: null,
  referenceLink: 'https://example.com/brief', submissionLink: null,
  completedAt: null, missReason: null, lateSubmission: null,
  createdAt: FieldValue.serverTimestamp(),
});
console.log('task:', task.id);

const job = await db.collection('jobs').add({
  title: 'QA Graphic Designer', team: 'DESIGN', type: 'PART_TIME',
  location: 'Remote', salary: '₹10,000/mo', description: 'QA seeded opening.',
  applyLink: null, active: true, createdAt: FieldValue.serverTimestamp(),
});
console.log('job:', job.id);
