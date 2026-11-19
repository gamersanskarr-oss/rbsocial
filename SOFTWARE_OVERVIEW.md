# RB Social Branding — Software Overview

> Auto-generated architecture documentation. Verified against source code; assumptions are marked.

## What the software is

Two products in one Next.js app:

1. **Public marketing website** (`/`) — agency homepage (hero, about, client
   logos, work showcase, testimonials, services, process, industries, careers,
   contact/footer) plus a public `/careers` page with a working application
   form, and a public read-only shared report viewer at `/report/[id]`.
2. **Internal team-management software** — three role-gated workspaces:
   - `/admin` — Super Admin (owner) + Accountant finance views
   - `/manager` — Social Media Manager workspace
   - `/dashboard` — Employee (designer / IT) workspace

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16.3.8** (App Router, Turbopack), React **19.2.8**, TypeScript |
| Styling | Tailwind CSS v4 + custom design tokens in `src/app/globals.css` |
| Auth | Firebase Authentication (email+password) → Admin SDK **session cookie** (5-day) |
| Database | Firestore via `firebase-admin` SDK (all server-side reads/writes) |
| Storage | None — uploads go to `public/uploads/` on local disk (logo files) |
| Server logic | Next.js **Server Actions** only (no REST API except `/api/health`) |
| Testing | Vitest 3 + in-memory fake-Firestore helpers (`tests/fake-db.ts`) |
| Frontend FX | GSAP/ScrollTrigger, `ogl` WebGL carousel — all lazy-loaded client-side |
| Rate limiting | In-memory sliding-window (`src/lib/rate-limit.ts`) |

## Architecture shape

```
Client (login form)
   └─ signInWithEmailAndPassword (Firebase client SDK)
        └─ createSessionFromIdToken() server action
             └─ adminAuth.verifyIdToken → createSessionCookie → `session` cookie
Every guarded page/action:
   └─ getSessionUser(): verifySessionCookie(checkRevoked) + users/{uid} profile
        └─ requireAdmin / requireManager / requireEmployee /
           requireAdminOrManager / requireAdminOrAccountant
Data layer:
   └─ src/lib/data.ts — typed records + read helpers; writes happen
      directly in server actions (adminDb + Timestamp + FieldValue)
Lazy engines (run on page loads, not cron):
   └─ checkMissedDeadlines() — flips overdue PENDING tasks → MISSED + strikes
   └─ ensureMonthlyCharges() — creates this month's retainer payment rows
   └─ processSubscriptions() — logs due subscription expenses, rolls dates
```

## Firestore collections

`users`, `clients`, `clientAssets`, `tasks`, `taskRequests`,
`clientPayments`, `expenses`, `subscriptions`, `dharamDisbursements`,
`jobs`, `jobApplications`, `sharedReports`, `activityLog`,
`settings/finance`, `settings/taskTypes`.

## Key design decisions (verified)

- **Server-only data access** — every page is a server component guarded by a
  `require*` helper; Firestore is never touched from the browser.
- **Roles live in `users/{uid}`** — role is read per request (with a 60s
  in-memory session cache), so role changes propagate within a minute.
- **No composite indexes** — all queries are single-field; joins/filtering
  happen in JS inside `data.ts`.
- **IST-aware dates** — bare `datetime-local` inputs are parsed as
  Asia/Kolkata (`parseISTDateTime`), so deadlines are timezone-correct.
- **Toast UX** — shared `ToastForm`/`useActionToast` wraps every action form.
