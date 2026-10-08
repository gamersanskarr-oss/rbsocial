# RB Social Branding — Agency Site + Task Management Dashboard

Next.js 16 (App Router, TypeScript, Tailwind v4) with Firebase:
**Firestore** for data + **Firebase Auth** for sign-in.
Single-page marketing site at `/`, plus three role-based dashboards
(admin `/admin`, social-media manager `/manager`, employee `/dashboard`).

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` / `npm start` — production build/start
- `npm run seed` — seed Firebase (Firestore + Auth users; aborts if data exists)
- `npm run lint` — ESLint

## Env vars (.env)

- Client SDK (login page): `NEXT_PUBLIC_FIREBASE_API_KEY`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_APP_ID`
- Admin SDK (all server reads/writes): `FIREBASE_SERVICE_ACCOUNT` = the
  service-account JSON on one line (or base64). Alternative triple:
  `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
  (keep `\n` escapes).

## Demo logins (after `npm run seed`)

- Admin: `admin@pixeldesk.com` / `admin123`
- Manager: `manager@pixeldesk.com` / `manager123`
- Accountant: `accountant@pixeldesk.com` / `accounts123`
- Employees (password `user123`): `priya@pixeldesk.com` (Design),
  `rahul@pixeldesk.com` (Design), `arjun@pixeldesk.com` (IT)

## Architecture

- `src/lib/firebase-admin.ts` — Admin SDK singleton (`adminAuth`, `adminDb`).
  Lazily initialized so `next build` works without credentials; env vars are
  only required on real requests. Safe to import from scripts/ too.
- `src/lib/firebase-client.ts` — client SDK, used only by the login form.
- `src/lib/data.ts` — the data layer that replaced Prisma. Typed record
  types + read helpers (listEmployees, listTasksWithRefs, getTaskDetail,
  completedTasksBetween, countOpenRequests, listPaymentsWithClient, …).
  Firestore Timestamps are converted to `Date` on read. Writes go through
  `adminDb` + `Timestamp`/`FieldValue` (re-exported from data.ts) directly
  in the server actions. Queries stay single-field where possible — filters/
  ordering/joins are done in JS so no composite indexes are needed.
- `src/lib/auth.ts` — Firebase session cookie (`session`, 5 days) created via
  `adminAuth.createSessionCookie`. `getSessionUser` verifies the cookie and
  loads the user profile doc from Firestore `users/{uid}`.
  `requireAdmin` / `requireManager` / `requireEmployee` guard layouts;
  `requireAdminOrManager` guards shared actions; `roleHome()` maps
  role → workspace. Login = client `signInWithEmailAndPassword` →
  `createSessionFromIdToken` server action.
- `src/lib/deadlines.ts` — `checkMissedDeadlines()` flips overdue PENDING
  tasks to MISSED and increments the assignee's counter (Firestore batch);
  runs lazily on dashboard/admin page loads. `payoutStatus()` applies the
  payout rule.
- `src/app/actions/` — server actions (auth, admin CRUD, task submission).
  `addEmployee` creates the Firebase Auth user + `users/{uid}` profile doc.
- Firestore collections: `users` (doc id = Firebase Auth uid; role
  ADMIN/EMPLOYEE/MANAGER, team DESIGN/IT for employees, missedDeadlines,
  perPostPay), `clients` (contact/socials/logoUrl/notes/assignedToId),
  `clientAssets` (clientId, name, url), `tasks` (topic, description,
  clientId, assignedToId, deadline, status, referenceLink, submissionLink,
  completedAt), `taskRequests` (taskId, message, status OPEN/RESOLVED),
  `clientPayments` (clientId, amount, paidAt, note).
- UI: soft, crisp monochrome theme (warm stone neutrals, charcoal primary,
  no purple; pastel status badges; rounded-2xl/3xl corners, smooth
  transitions). Font: Plus Jakarta Sans via next/font (--font-jakarta). Design
  tokens (ink/muted/faint/line/panel/hover/accent + shadow-soft/shadow-lift)
  and component classes (.card/.input/.btn-*/.link/.banner-*) live in
  `globals.css`; shared sidebar shell in
  `src/components/dashboard-shell.tsx` (client component, active-link
  highlight + mobile drawer). `admin`, `manager` and `dashboard` layouts use it.
- `/manager` — social-media-manager workspace (role MANAGER; no team). Shows
  only Tasks, Calendar, Requests, Assign Task. Pages reuse the shared views in
  `src/components/workspace/` (same bodies as the admin pages, parameterized
  by basePath so links stay inside the workspace). Admin can create managers
  from the Employees page (Role = Social Media Manager); they are not listed
  in the employee/payout tables.
- Client profiles: admin edits at /admin/clients/[id] (logo uploads go to
  public/uploads via updateClientDetails, gitignored). Employees see their
  assigned clients at /dashboard/clients (+ [id] detail) — enforced by
  assignedToId check (404 otherwise).
- `/admin/payouts` — Payouts tab: filter bar (month, employee, team), month-end
  settlement per employee (posts completed that month x perPostPay, minus the
  10% deduction when at payout risk), and per-post rate editor (same
  `setPerPostPay` action as the Employees page).
- Finance module (powered by ROSHAN BHARAT) lives under `/admin/*` and is
  visible to ADMIN (owner) and ACCOUNTANT roles; all finance pages are
  guarded by `requireAdminOrAccountant`, finance settings by `requireAdmin`.
  - `/admin/finance` — executive dashboard: month KPIs (received,
    outstanding, expenses, net profit, margin), revenue-target progress bar,
    online-vs-cash split, overdue/due-today follow-up feed, recent activity
    feed (`activityLog`), monthly breakdown, owner-only settings (target +
    Dharam %).
  - `/admin/payments` — revenue ledger with the two-date model: `forMonth`
    (service month, "YYYY-MM") + `dueDate` vs `receivedAt` (settlement).
    Status is derived: PENDING → DUE_TODAY → OVERDUE → RECEIVED. Inline
    "Received" (sets receivedAt+method), "+ Follow-up" (counter +
    lastContactedAt), printable receipt at `/admin/payments/[id]`.
  - `/admin/expenses` — categorized spend (EXPENSE_CATEGORIES in
    `src/lib/constants.ts`), optional `staffId` link for staff payouts.
  - `/admin/subscriptions` — recurring SaaS tracker; `processSubscriptions()`
    lazily logs an expense and rolls `nextPaymentDate` forward.
  - `/admin/dharam` — tithe fund: accrues `dharamPercent`% of positive
    monthly net profit (computed from `bucketByMonth`), minus recorded
    disbursements (recipient/cause ledger).
  - `/admin/reports` — horizon filter (this/last month, 3m, 6m, year, all),
    revenue-by-client and expenses-by-category bars, plus shareable
    read-only links: `createShareLink` stores a snapshot in `sharedReports`
    and the public page `/report/[id]` renders it without auth.
  - `ensureMonthlyCharges()` lazily creates one pending payment per active
    client per month based on `monthlyFee`/`billingDay`/`billingModel`
    (PREPAID/POST_WORK due on billingDay, MID_MONTH due 15th, POSTPAID due
    billingDay of next month). Both engines run on finance/payments loads.
  - Client billing fields (`status`, `billingDay`, `billingModel`,
    `monthlyFee`, `feeEffectiveFrom`, `previousMonthlyFee`) are edited on
    the client detail page via `updateClientBilling`; fee changes keep the
    old rate in `previousMonthlyFee`.
  - Collections added: `expenses`, `subscriptions`, `dharamDisbursements`,
    `activityLog`, `sharedReports`, `settings/finance`. `clientPayments`
    gained forMonth/dueDate/receivedAt/method/followUps/lastContactedAt
    (legacy `paidAt` is mapped to `receivedAt` on read).

## Business rules

- Admin assigns clients to graphic designers and creates tasks
  (topic, client, assignee, description, deadline, optional reference link).
- Employee opens a task, sees topic/client/description/links, pastes the
  final design link (e.g. Canva) and marks it completed.
- Policy: 3 missed deadlines => 10% payout reduction. Admin can excuse misses
  per employee on the Employees page ("Waive 1" decrements, "Reset" clears)
  via the `waiveMiss` action.
