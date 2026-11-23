# RB Social Branding — Complete Software Documentation

A single-page marketing website + multi-role task-management dashboard for a
creative agency, built as one Next.js application.

---

## Table of Contents

1. [What This Software Is](#1-what-this-software-is)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Roles & Access Control](#5-roles--access-control)
6. [Authentication — Complete Flow](#6-authentication--complete-flow)
7. [Data Layer & Firestore Schema](#7-data-layer--firestore-schema)
8. [Core Workflows](#8-core-workflows)
9. [Background Engines](#9-background-engines)
10. [Business Rules](#10-business-rules)
11. [Security Model](#11-security-model)
12. [Timezone Model (IST)](#12-timezone-model-ist)
13. [Marketing Site](#13-marketing-site)
14. [UI System](#14-ui-system)
15. [Environment & Deployment](#15-environment--deployment)
16. [Scripts & Maintenance](#16-scripts--maintenance)
17. [Testing](#17-testing)
18. [Glossary](#18-glossary)

---

## 1. What This Software Is

RB Social Branding is a digital-marketing agency's complete operations system.
It has two halves in one codebase:

| Half | Route | Who uses it |
|---|---|---|
| **Marketing site** | `/` (public) | Potential clients — services, portfolio, testimonials, careers |
| **Workspace dashboards** | `/admin`, `/manager`, `/dashboard` | The agency team — tasks, clients, finance, payouts |

The dashboard is the operational core: the owner assigns design work to
employees, tracks deadlines, reviews submissions, manages clients and billing,
and computes month-end payouts — all backed by Firebase.

**The one-sentence workflow:** Admin/manager assigns a task → employee submits
the finished design link → admin/manager reviews and approves → completed work
converts into the employee's monthly payout, and client work converts into
tracked revenue.

---

## 2. Tech Stack

| Layer | Technology | Why this choice |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Server components + server actions give a backend without a separate API server |
| Language | **TypeScript** (strict) | Type safety across the data layer and UI |
| Styling | **Tailwind CSS v4** | Utility-first; design tokens live in `globals.css` |
| Database | **Firebase Firestore** (via Admin SDK) | Serverless NoSQL — no DB server to run; realtime-capable |
| Auth | **Firebase Auth** + session cookies | Managed identity; session cookie flow for SSR-friendly auth |
| Hosting | **Vercel** | Zero-config Next.js deploys on every `git push` |
| Testing | **Vitest** (unit/integration) + **Playwright** (E2E) | In-memory Firestore fake for fast tests; browser E2E for real flows |
| Fonts | Plus Jakarta Sans via `next/font` | Self-hosted, no layout shift |

**Deliberate non-choices:** no Prisma/SQL (Firestore chosen for zero-ops), no
Redux/Zustand (server components + URL state cover it), no separate API layer
(server actions replace REST endpoints).

---

## 3. System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │                BROWSER                    │
                    │  marketing site · login form · dashboards │
                    └───────┬──────────────────────┬───────────┘
                            │ HTML/RSC payload     │ Firebase client SDK
                            ▼                      ▼ (sign-in only)
        ┌─────────────────────────────────┐   ┌──────────────────┐
        │        NEXT.JS SERVER (Vercel)  │   │  Firebase Auth   │
        │                                 │   │  (identity)      │
        │  Server Components  ────────────┼──►│ verify session   │
        │  Server Actions     ────────────┼──►│ create/revoke    │
        │        │                        │   └──────────────────┘
        │        ▼                        │
        │  lib/data.ts (data layer)       │
        │  lib/auth.ts (session/guards)   │
        │  lib/deadlines.ts (engines)     │
        │        │                        │
        └────────┼────────────────────────┘
                 ▼
        ┌──────────────────┐
        │     FIRESTORE    │  users · clients · tasks · clientPayments
        │   (documents)    │  expenses · subscriptions · activityLog …
        └──────────────────┘
```

**Key architectural decisions:**

- **No REST API.** All mutations go through **server actions** (`src/app/actions/*`)
  — typed functions the client calls directly; Next.js turns them into secure
  RPC endpoints. Reads happen inside server components.
- **One data module.** Every Firestore read/write passes through
  `src/lib/data.ts` (server-only). Pages never touch the DB directly.
- **Auth at the layout level.** Each workspace layout (`admin`, `manager`,
  `dashboard`) calls a `require*` guard before rendering anything inside it.
- **Lazy engines.** Scheduled jobs (deadline scans, monthly billing) run
  opportunistically on page loads instead of a cron server — zero
  infrastructure, at the cost of "runs when someone visits".

---

## 4. Project Structure

```
rb/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Marketing site (single page, anchored sections)
│   │   ├── login/                 # Login form (client SDK sign-in)
│   │   ├── admin/                 # Owner workspace (+ finance module, ACCOUNTANT)
│   │   │   ├── page.tsx           #   Overview: KPIs, upcoming tasks
│   │   │   ├── employees/         #   Team management, per-post rates, waives
│   │   │   ├── clients/           #   Clients + assignment + billing fields
│   │   │   ├── tasks/[id]/        #   Task detail (edit + review submission)
│   │   │   ├── calendar/          #   Drag-to-reschedule calendar
│   │   │   ├── payouts/           #   Month settlement + per-task prices + rates
│   │   │   ├── payments/          #   Revenue ledger (two-date model)
│   │   │   ├── expenses/          #   Spend + subscriptions tracker
│   │   │   ├── dharam/            #   Tithe fund ledger
│   │   │   ├── reports/           #   Revenue/expense charts + share links
│   │   │   └── jobs/              #   Careers postings + applications
│   │   ├── manager/               # Social-media-manager workspace (subset of admin)
│   │   ├── dashboard/             # Employee workspace (my tasks, my clients)
│   │   ├── report/[id]/           # PUBLIC shared report page (no auth)
│   │   ├── careers/               # PUBLIC job listings + application form
│   │   └── actions/               # Server actions: auth, admin, tasks, finance…
│   ├── components/
│   │   ├── dashboard-shell.tsx    # Sidebar shell (nav, badges, logout) — all roles
│   │   ├── workspace/             # Shared admin/manager views + forms
│   │   ├── clients-table.tsx      # (workspace) filterable/sortable clients table
│   │   ├── task-calendar.tsx      # Month calendar (client component)
│   │   ├── due-time.tsx           # Timezone-safe date/time renderer
│   │   ├── toast.tsx              # Toast system + ToastForm action wrapper
│   │   └── ui.tsx                 # PageHeader, StatusBadge, Card, TeamBadge
│   ├── lib/
│   │   ├── firebase-admin.ts      # Admin SDK singleton (lazy init)
│   │   ├── firebase-client.ts     # Client SDK (login page only)
│   │   ├── data.ts                # THE data layer — all Firestore I/O
│   │   ├── auth.ts                # Session cookie + role guards
│   │   ├── deadlines.ts           # Missed-deadline engine + payout constants
│   │   ├── rate-limit.ts          # In-memory sliding-window limiter
│   │   └── constants.ts           # Shared constants (task types, categories)
│   └── app/globals.css            # Design tokens + component classes
├── tests/                         # Vitest integration tests (fake Firestore)
├── e2e/                           # Playwright browser tests
├── scripts/                       # seed.ts, wipe.ts, make-admin.ts, del-user.ts
├── public/                        # Images: clients/, showcase/, reels/, uploads/
└── next.config.ts                 # Security headers, serverActions experiment
```

---

## 5. Roles & Access Control

Four roles, stored on each user document (`users/{uid}.role`):

| Role | Home | Sees | Can do |
|---|---|---|---|
| **ADMIN** (owner) | `/admin` | Everything | All CRUD, pay amounts, finance settings, payouts, waives, managers |
| **MANAGER** | `/manager` | Tasks, Clients, Calendar, Requests, Team, Reports | Assign/review tasks, assign clients — **no pay/finance** |
| **EMPLOYEE** | `/dashboard` | My tasks, My clients, Calendar | Submit work, quote price, raise requests |
| **ACCOUNTANT** | `/admin/payments` | Finance module only | Payments, expenses, reports — guarded by `requireAdminOrAccountant` |

**Guard functions** (`src/lib/auth.ts`) — every layout/action calls one:

```ts
requireUser()              // any signed-in user, else redirect /login
requireAdmin()             // else redirect to their own home
requireManager() / requireEmployee()
requireAdminOrManager()    // shared admin+manager actions
requireAdminOrAccountant() // finance pages
```

The pattern: **verify → redirect if wrong role → return the user**. Wrong-role
users never see a 403 page; they are silently sent to their own workspace.
Finance *settings* (revenue target, Dharam %) are additionally admin-only.

---

## 6. Authentication — Complete Flow

The app uses **Firebase Auth for identity + a server session cookie for state**.
This hybrid gives SSR-friendly auth (the server can read the cookie) while
Firebase handles password security.

```
BROWSER                                     SERVER
───────                                     ──────
1. login-form.tsx
   signInWithEmailAndPassword() ──────────────► Firebase Auth (client SDK)
   ◄── ID token (short-lived JWT)

2. POST createSessionFromIdToken(idToken)
   (server action, rate-limited 20/10min/IP)
                                            3. verifyIdToken(token)
                                            4. getUser(uid) — profile must exist
                                            5. adminAuth.createSessionCookie(
                                                 idToken, { expiresIn: 5 days })
                                            6. Set-Cookie: session (httpOnly,
                                               secure, sameSite=lax)
   ◄── redirect(roleHome(user.role))

7. Every request after:
   server reads `session` cookie ───────────► verifySessionCookie(cookie,
                                              checkRevoked: true)
                                            + getUser(uid) → SessionUser
   (cached in-memory 60s per cookie to avoid a network verify on every render)
```

**Why not just the client SDK session?** Server components can't read Firebase's
IndexedDB session — they need a cookie. `createSessionCookie` mints a secure
server-verified cookie from the ID token.

**Logout kills all devices.** `destroySession()` calls
`adminAuth.revokeRefreshTokens(uid)` — because session verification uses
`checkRevoked: true`, even cookies saved on other devices stop working.

**No self-signup.** Accounts are created only by admins (`addEmployee` creates
the Auth user + profile doc) or CLI scripts. A signed-in user without a
profile doc is rejected at login: "This account has no workspace profile."

---

## 7. Data Layer & Firestore Schema

`src/lib/data.ts` is the single gateway to Firestore (`import "server-only"`).
It exports typed record types + async read helpers; writes happen in server
actions using `adminDb` + `Timestamp`/`FieldValue` (re-exported from data.ts).

**Conventions:**

- Doc IDs: `users` uses the Firebase Auth **uid**; everything else auto-IDs.
- All Firestore `Timestamp`s are converted to JS `Date` on read (`withDates`).
- Queries stay **single-field** (no composite indexes needed); filtering,
  sorting and joins are done in JS after fetching — fine at agency scale
  (hundreds of docs), deliberately simple.
- Money is stored as plain numbers (INR); months as `"YYYY-MM"` strings.

### Collections

| Collection | Doc shape (key fields) | Notes |
|---|---|---|
| `users` | name, email, role (ADMIN/MANAGER/EMPLOYEE/ACCOUNTANT), team (DESIGN/IT, employees only), missedDeadlines, perPostPay, createdAt | id = Auth uid |
| `clients` | name, contact, phone, instagram, facebook, website, logoUrl, notes, requirements[], assignedToId (legacy), assignedToIds[], status (ACTIVE/ARCHIVED), billingDay, billingModel (PREPAID/POST_WORK/MID_MONTH/POSTPAID), monthlyFee, feeEffectiveFrom, previousMonthlyFee | multiple designers can share a client |
| `clientAssets` | clientId, name, url, createdAt | brand assets per client |
| `tasks` | topic, description, clientId, assignedToId, deadline (Timestamp), status (PENDING/COMPLETED/MISSED), type, slideCount, payAmount, payStatus (NONE/PENDING/APPROVED), missReason, lateSubmission, approval (NONE/PENDING/APPROVED/CHANGES/REJECTED), reviewNote, referenceLink, submissionLink, completedAt, createdAt | the operational core |
| `taskRequests` | taskId, message, status (OPEN/RESOLVED), createdAt, resolvedAt | employee → admin asks (files, info) |
| `clientPayments` | clientId, forMonth ("YYYY-MM"), amount, dueDate, receivedAt (null until paid), method (ONLINE/CASH), note, followUps[], lastContactedAt | legacy `paidAt` maps to `receivedAt` |
| `expenses` | date, category (EXPENSE_CATEGORIES), amount, note, staffId? | staffId links staff payouts |
| `subscriptions` | name, amount, cycle (MONTHLY/YEARLY), nextPaymentDate, active | recurring SaaS costs |
| `dharamDisbursements` | date, recipient, cause, amount | tithe fund outflow |
| `activityLog` | type (admin/billing/expense/…), message, createdAt | audit feed on finance dashboard |
| `sharedReports` | snapshot JSON, expiresAt | public `/report/[id]`, 90-day expiry |
| `settings/finance` | revenueTarget, dharamPercent | owner-only editable |
| `settings/taskTypes` | options: string[] | custom deliverable types merged with defaults |
| `jobs` | title, description, active, createdAt | careers page listings |
| `jobApplications` | jobId, jobTitle, name, email, phone, portfolio, message, status (NEW/REVIEWED), createdAt | public applications |

### Important read helpers

```ts
listTasksWithRefs()      // all tasks + client name + assignee name + open requests
listTasksForUser(uid)    // employee's tasks, sorted by status then deadline
completedTasksBetween()  // COMPLETED with completedAt in [start, end) — payouts
getTaskDetail(id)        // task + client + assignee + requests (detail page)
taskCountsByClient()     // clientId → task count
listEmployeeOptions()    // {id, name, team, perPostPay}[] for dropdowns
```

---

## 8. Core Workflows

### 8.1 Task Lifecycle (the heart of the system)

```
ADMIN/MANAGER                    EMPLOYEE                       ADMIN/MANAGER
─────────────                    ────────                       ─────────────
createTask()                                                         
  topic, type, client,                                              
  assignee, deadline (IST),                                         
  reference link, pay?                                              
      │                                                             
      ▼                                                             
  status: PENDING ──────► employee opens task                       
                          sees brief + links                        
                          submitTask():                             
                            paste final design link                 
                            optional ₹ quote                        
                                │                                   
                                ▼                                   
                          status: COMPLETED                         
                          completedAt: now                          
                          approval: PENDING ───► reviewTaskAction() 
                          lateSubmission if             │           
                          deadline passed      ┌────────┼────────┐ 
                                                          ▼        
                                                  decision=approve 
                                                  → approval: APPROVED
                                                  (payout-eligible)  
```

- **Review outcomes:** `approve` → APPROVED · `changes` → task reopens PENDING
  (approval CHANGES, employee resubmits) · `reject` → same but REJECTED.
  If the deadline already passed at reopen time, it is extended +24h so the
  employee isn't instantly re-missed.
- **Pay quotes:** if the employee quotes a different amount than their per-post
  rate, `payStatus` goes PENDING; an admin approves/declines the quote
  (`reviewTaskPay` — approve can adjust the amount). Until approved, the base
  rate applies. Managers never touch pay fields.
- **Approval can also happen inline** from the admin Payouts tab
  ("Task prices" table → Approve ✓ button → `reviewTaskAction`).
- **Editing:** `updateTask` (admin/manager) can change everything including
  status; manually flipping PENDING↔MISSED adjusts the assignee's strike
  counter by ±1.

### 8.2 Calendar

Month grid (client component) fed by the same task data. Features:
- Color-coded chips: amber = PENDING, emerald = COMPLETED, rose = MISSED
- Hover tooltip: topic, client · assignee, time · type · status
- Admin/manager: **drag a chip to another day** to reschedule —
  `moveTaskDeadline(taskId, "YYYY-MM-DD")` keeps the IST wall-clock time,
  moves the date, and re-derives status (past → MISSED +1 strike,
  future → back to PENDING −1 strike)
- Admin/manager: click an empty day → assign-modal prefilled with that date
  at 18:00 IST
- Day cells grow with task count (no inner scroll)

### 8.3 Client Management

- Admin creates clients (with deliverable requirements, e.g. "5 Static Posts
  per week") and assigns **one or more** designers (`assignedToIds[]`).
- Managers see the same clients table with search + filters (employee,
  deliverable, task status), sortable columns, live counters, and can
  reassign employees — but never see billing fields.
- Employees see **only their assigned clients** (`assignedToId` check → 404
  otherwise) at `/dashboard/clients`.
- Client detail pages hold assets, notes, task history; admin also edits
  billing fields here (logo uploads go to `public/uploads`, gitignored).

### 8.4 Finance Module (ADMIN + ACCOUNTANT)

Powered by the **two-date payment model**: every payment has a service month
(`forMonth`) and a settlement pair (`dueDate` vs `receivedAt`). Status is
**derived**, never stored:

```
PENDING → DUE_TODAY (dueDate = today) → OVERDUE (dueDate < today) → RECEIVED
```

- **`/admin/payments`** — revenue ledger; inline "Received" (sets receivedAt +
  method), "+ Follow-up" (counter + lastContactedAt), printable receipt page.
- **`/admin/expenses`** — categorized spend (optional staffId link) +
  subscriptions tracker (see engines below). `/admin/subscriptions` redirects here.
- **`/admin/dharam`** — tithe fund: accrues `dharamPercent`% of positive
  monthly net profit, minus recorded disbursements.
- **`/admin/reports`** — horizon filters, revenue-by-client and
  expense-by-category bars, plus **shareable read-only links**: `createShareLink`
  snapshots the report into `sharedReports`; `/report/[id]` renders it publicly,
  expiring after 90 days.
- **`/admin/finance`** — executive dashboard: month KPIs (received, outstanding,
  expenses, net profit, margin), revenue-target progress, online-vs-cash split,
  overdue/due-today follow-up feed, recent activity (`activityLog`), owner-only
  settings (target + Dharam %).

### 8.5 Payouts (`/admin/payouts`, admin-only)

Three tables on one page:
1. **Month-end settlement per employee** — posts completed that month ×
   perPostPay, minus the 10% deduction when at payout risk, plus the 10%
   on-time bonus when ≤1 miss. Filterable by month/employee/team.
2. **Task prices** — every completed task with its actual pay
   (`taskPay = payAmount ?? perPostPay`), quote-pending chips, and the inline
   Approve button for pending submissions. Excel/CSV download per employee.
3. **Per-post rates** — editor per employee (`setPerPostPay`).

### 8.6 Requests

Employees raise a request on a task ("need the logo file") — blocked within 6h
of the deadline to prevent last-minute stalls. Open requests show as badges on
the sidebar and in the tasks table; admin/manager resolves them.

---

## 9. Background Engines

No cron server — three lazy engines run **on page loads**:

| Engine | Trigger | What it does |
|---|---|---|
| `checkMissedDeadlines()` | dashboard/admin/manager/calendar loads | Finds PENDING tasks past deadline → batch-flips to MISSED → increments each assignee's `missedDeadlines` counter |
| `ensureMonthlyCharges()` | finance/payments loads | Creates one PENDING payment per active client per month from `monthlyFee` + `billingModel` (PREPAID due on billingDay, POST_WORK due on billingDay, MID_MONTH due 15th, POSTPAID due billingDay of next month) |
| `processSubscriptions()` | expenses page load | When a subscription's `nextPaymentDate` passes: logs an expense and rolls the date forward (monthly/yearly) |

**Trade-off:** zero infrastructure, but the scan only runs when someone
visits. If nobody logs in for days, misses are still caught correctly on the
next load (the scan is date-based, not event-based) — counters just update late.

---

## 10. Business Rules

### Strike system (missed deadlines)
- Every task that goes past its deadline un-submitted = **1 strike**
  (`missedDeadlines` on the user doc).
- Admin can **Waive 1** (decrement) or **Reset** (zero) per employee —
  `waiveMiss` action, logged to activity.
- Manual status flips in task edit also adjust strikes (±1) to stay honest.

### Payout rules
```
misses ≥ 3  → payout = gross × 0.90   (10% deduction)
misses ≤ 1  → payout = gross × 1.10   (on-time bonus, only if not reduced)
otherwise   → payout = gross
net = gross − deduction + bonus
```
Constants live in `src/lib/deadlines.ts`: `MISSED_DEADLINE_LIMIT = 3`,
`PAYOUT_REDUCTION = 0.1`, `PAYOUT_BONUS = 0.1`, `BONUS_GRACE_MISSES = 1`.

### Billing models (client retainers)
| Model | Due date |
|---|---|
| PREPAID | billingDay of the service month |
| POST_WORK | billingDay of the service month |
| MID_MONTH | 15th of the service month |
| POSTPAID | billingDay of the **next** month |

Fee changes keep the old rate in `previousMonthlyFee` for history.

---

## 11. Security Model

| Layer | Mechanism |
|---|---|
| Identity | Firebase Auth; no self-signup; profile-doc check at login |
| Session | httpOnly + secure + sameSite=lax cookie, 5 days, server-verified with `checkRevoked: true`; logout revokes refresh tokens (all devices) |
| Authorization | Role guards on every layout + every server action (`require*`); client detail pages enforce `assignedToId` ownership (404) |
| Rate limiting | `src/lib/rate-limit.ts` in-memory sliding window: login 20/10min/IP, job applications, task submissions 40/h, miss-reasons 30/h, task requests, share links |
| Headers | `next.config.ts`: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| XSS (links) | `safeHref()` strips `javascript:`/`data:`/`vbscript:` from every user-entered URL rendered as `href` |
| Secrets | Only in env vars / gitignored `service-account.json`; scripts take argv input, never hardcode |
| Public surface | Only `/`, `/careers`, `/login`, `/report/[id]` are unauthenticated; shared reports are read-only snapshots with 90-day expiry |

**Rate-limiter caveat:** it is in-memory per server instance — resets on
deploy, doesn't share across regions. Adequate for this scale; a shared store
(e.g. Redis/Upstash) is the upgrade path if abuse ever matters.

---

## 12. Timezone Model (IST)

The whole team works in **India Standard Time (+05:30)**. The system treats
IST as the company's canonical wall clock, independent of server timezone
(Vercel servers run UTC).

**Storage — always the true instant:**
- `parseISTDateTime("2026-11-22T18:00")` parses bare `datetime-local` input as
  IST (`…T18:00:00+05:30`) and stores the correct UTC instant in Firestore.
  Impossible dates (Feb 30) are rejected, not rolled forward.
- `shiftISTDay(date, y, m, d)` moves an instant to another calendar day while
  keeping its IST time-of-day (used by calendar drag-reschedule).

**Display — never trust the server clock:**
- Server-rendered `toLocaleTimeString()` formats in the **server's** timezone
  (UTC on Vercel) — the classic "I assigned 6 PM, it shows 12:30" bug.
- Rule: user-facing times render through **`<DueTime iso={…} />`**, a client
  component that formats in the **viewer's** timezone (with
  `suppressHydrationWarning` for the SSR→hydration flip).
- Server-generated files with no viewer (CSV report downloads) pin
  `timeZone: "Asia/Kolkata"` explicitly.
- Date-only finance fields (due dates, fee-effective dates) are stored as IST
  midnights and rendered with DueTime as well.

---

## 13. Marketing Site

Single page (`src/app/page.tsx`), anchored sections, dark navy theme with
coral accent and WebGL effects:

| Section | Content / Effect |
|---|---|
| Nav | Floating glass capsule, mobile drawer menu |
| Hero | Gradient headline, WhatsApp CTA, **WebGL light tunnel** (canvas cables + traveling pulses), vertical-blinds overlay |
| Client marquee | 23 client logos, glowing band, active/inactive glow states |
| Services | 5 numbered services (SM management, content, ads, web, software) |
| Why us / Process | 5 + 5 cards (strategy narrative) |
| Industries | 9 chips |
| Our Work | Industry reels carousel (Instagram links) |
| Showcase | **FlexCarousel** (WebGL "liquid" preset) of real design posters — drag/scroll/zoom; items render in array order (infinite loop: last wraps to first) |
| Testimonials | Client reel cards |
| Roshan Bharat | Media-house perks (newspaper features, sponsored posts…) |
| Careers | Live job listings from Firestore + `applyForJob` (rate-limited) |
| Contact | WhatsApp, email, Google Maps deep link |

All heavy visuals are client components loaded with `next/dynamic`
(`ssr: false`) so the server HTML stays light.

---

## 14. UI System

- **Two themes:** marketing site `.theme-site` (navy/coral) and dashboards
  `.theme-dark` (graphite + warm off-white ink, no purple). Tokens
  (`--color-ink`, `--color-line`, `--color-elevated`, …) and component classes
  (`.card`, `.input`, `.btn-primary/secondary`, `.th`, `.td`, `.banner-*`)
  live in `globals.css`.
- **DashboardShell** (`dashboard-shell.tsx`) — shared sidebar for all roles:
  nav sections with icons, red count badges (open requests, pending reviews),
  earnings box for employees, user card with logout, mobile drawer.
- **Shared workspace views** (`components/workspace/`) — admin and manager
  pages render the same bodies parameterized by `basePath` so links stay
  inside each workspace.
- **Toast system** — `ToastProvider` + `useToast` + `ToastForm` (a `<form>`
  that runs a server action in a transition and toasts the result).
- Icons are inline SVG paths keyed by name (`NavIcon` map in the shell).

---

## 15. Environment & Deployment

**Env vars (`.env`, gitignored):**

```
# Client SDK — login form only
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…

# Admin SDK — all server reads/writes (either form)
FIREBASE_SERVICE_ACCOUNT=<service-account JSON on one line, or base64>
# or: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
```

`firebase-admin.ts` resolves credentials in order: env JSON/base64 →
`service-account.json` in project root (gitignored) → split env triple.
Initialization is **lazy** (a Proxy that initializes on first property access)
so `next build` works without credentials; they're only needed on real requests.

**Deploy:** push to `main` → Vercel builds with `npm run build`
(compiles + **type-checks everything, including test files** — type errors
anywhere fail the deploy) → routes are server-rendered on demand.

**Commands:**

| Command | What |
|---|---|
| `npm run dev` | Dev server at :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit/integration suite |

---

## 16. Scripts & Maintenance

| Script | Purpose |
|---|---|
| `npm run seed` | Demo dataset (admin/manager/accountant/employees + clients + tasks) — **aborts if any data exists** |
| `npm run wipe` | Deletes ALL Firestore data + Auth users **except** the keep-list in `scripts/wipe.ts` (the owner admin) |
| `npx tsx scripts/make-admin.ts <email> <password>` | Create an admin user |
| `npx tsx scripts/del-user.ts <email>` | Fully remove a user (Auth + profile doc) |

Scripts share the lazy `firebase-admin.ts` singleton and take credentials
from env/argv — never hardcoded.

**Production account policy:** the DB was wiped clean (Oct 2026); the only
account is the owner's ADMIN login. Managers/employees/accountants are added
from `/admin/employees` (Role dropdown).

---

## 17. Testing

### Unit / integration — Vitest (`tests/`)
- `tests/fake-db.ts` — an in-memory Firestore emulation (collections, docs,
  `Timestamp`/`FieldValue` fakes) wired in via `vi.mock("firebase-admin/firestore")`
  and `vi.mock("@/lib/firebase-admin")`.
- `tests/lifecycle.test.ts` — the big one: full task lifecycle (create →
  submit → review → approve), request flow, finance actions, share links,
  careers — **162 tests**, all against the fake DB. Role switching is just
  `authState.user = EMPLOYEE`.
- `tests/edge-cases.test.ts`, `tests/state.ts` — helpers + edge coverage.

### E2E — Playwright (`e2e/`)
- Real browser flows against a dev server (`playwright.config.ts`: serial
  workers — tests share live DB state; `storageState` auth sessions per role:
  `e2e/.auth/{admin,manager,designer}.json`).
- Run with `npx playwright test` (needs the dev server up + seeded accounts).

**Note:** vitest currently also picks up `e2e/*.spec.ts` files and reports
them as collection failures — they're Playwright specs, not vitest tests
(cosmetic runner-config issue; add an `exclude` in vitest config to silence).

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **RSC / Server Component** | Component rendered only on the server; can read the DB directly, ships zero JS |
| **Server Action** | A `"use server"` async function the client can call directly — the app's entire mutation API |
| **Session cookie** | httpOnly cookie minted from a Firebase ID token; how the server knows who you are |
| **Strike** | One missed deadline (`missedDeadlines` counter) |
| **Per-post pay** | Employee's rate per completed post; a task can override it with an approved quote |
| **Two-date model** | Payment tracking: service month (`forMonth`) + `dueDate` vs `receivedAt` |
| **forMonth** | `"YYYY-MM"` string — which service month a payment belongs to |
| **Dharam** | The agency's tithe fund — a fixed % of monthly net profit |
| **Deliverable / task type** | What kind of work: Static Post, Carousel, Story, Video Edit… (defaults + custom in `settings/taskTypes`) |
| **IST wall clock** | The company's canonical timezone (+05:30) — inputs parse as IST, displays render in the viewer's zone |

---

*Last updated: Nov 2026 — covers the app through commit `b2d11b2`
(manager clients rework, timezone display fixes, payouts approve, calendar
growth).*
