# Feature Inventory

Verified from source + live E2E execution.

## Public

| Route | Feature |
|---|---|
| `/` | Marketing homepage: hero, about, client-logo wall (active/inactive glow), work carousel (real IG reels), showcase, testimonials, services, why-us, process, industries, Roshan Bharat, careers teaser, contact |
| `/careers` | Active jobs from Firestore + application form (name/email/phone/portfolio, multi-role chips) + General Application fallback. Rate-limited, duplicate-per-role detection |
| `/report/[id]` | Public read-only finance snapshot; expires 90 days |
| `/login` | Firebase email+password → session cookie. Rate-limited 20/10min/IP |
| `/api/health` | Admin-SDK diagnostic JSON |

## Employee (`/dashboard`, role EMPLOYEE)

- `/dashboard` — my tasks (status-sorted), payout banner (strikes → % cut), strike counter
- `/dashboard/tasks/[id]` — brief, client, deadline countdown, **own per-task pay (Pays/Earned ₹)**, progress steps, submit link + optional price quote, miss-reason form (late), document requests (closed <6h to deadline / non-PENDING), resubmit after CHANGES/REJECTED
- `/dashboard/clients` + `/[id]` — only assigned clients; **404 for unassigned** (server-enforced)
- `/dashboard/calendar` — own tasks, read-only

## Manager (`/manager`, role MANAGER)

- `/manager` → redirects to `/manager/tasks`
- `/manager/tasks` + `/[id]` — assign-task form (**no pay field**), task table, review form (approve/changes/reject with note), full edit (**no pay**), custom task-type editor. **No quote badge / quote panel**
- `/manager/clients` — list + **AssignSelect** (multi-designer assign); detail page = creative profile only (no billing)
- `/manager/calendar` — team month view, click-day assign modal (editable date+time, worker select), drag-reschedule, filters
- `/manager/requests` — resolve employee requests
- `/manager/team` — open/done/missed counts, strikes + Waive 1/Reset, search/team/risk filters
- `/manager/reports` — per-employee monthly due/completed/missed/open + completion % (no finance)

## Admin (`/admin`, role ADMIN; finance routes also allow ACCOUNTANT)

- `/admin` — KPI dashboard + activity feed
- `/admin/tasks`,`/admin/calendar` — everything manager has **plus pay field + quote approve/decline**
- `/admin/clients` + `/[id]` — add client (requirements editor + initial assignees), assign designers, profile edit + logo upload (`public/uploads`), billing fields (status, billingDay, billingModel, monthlyFee + previous-fee history), client-assets CRUD
- `/admin/employees` — add member (EMPLOYEE/MANAGER/ACCOUNTANT; team DESIGN/IT), per-post rate editor, strikes + Waive/Reset
- `/admin/requests` — resolve (badge = open count)
- `/admin/payouts` — month/employee/team filters; settlement = posts×rate − 10% cut @≥3 strikes + 10% bonus @≤1 miss; per-task quotes; CSV export
- `/admin/payments` + `/[id]` — revenue ledger (forMonth + dueDate vs receivedAt; PENDING→DUE_TODAY→OVERDUE→RECEIVED), record/edit/delete, mark received, +follow-up, printable receipt
- `/admin/expenses` — categorized spend (8 categories, optional staffId) + subscriptions panel (auto-expense on due date)
- `/admin/dharam` — dharamPercent% of positive monthly net − disbursements ledger
- `/admin/reports` — horizon filters, revenue/expense bars, shareable snapshot links
- `/admin/jobs` — post/toggle/delete jobs; applications list, REVIEWED toggle, delete, CSV

## Cross-cutting

- **Lazy engines on page load**: `checkMissedDeadlines` (PENDING→MISSED + strike), `ensureMonthlyCharges` (auto retainer invoice per client per month), `processSubscriptions` (auto expense)
- **Badges**: open requests, pending reviews, pending quotes, new applications, due payments
- **Rate limits**: login, applications, submissions, requests, share links
- **activityLog** feed on admin home
- **Toasts** on every action form (in-app only — no email/push notifications)
