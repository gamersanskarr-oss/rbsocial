# QA Report — RB Social Branding Agency + Team Management

Branch: `qa/full-audit` · Date: Nov 2026 · Tester: Devin (autonomous QA)

## 1. Summary numbers

| Metric | Count |
|---|---|
| Features discovered | ~45 (see FEATURE_INVENTORY.md) |
| Pages/dashboards | 3 workspaces, ~28 routes |
| Test cases created | **207** (162 vitest + 45 Playwright) |
| Executed | 207 |
| Passed | **207** |
| Failed | 0 (final run) |
| Blocked | Email/push notifications — feature does not exist |

## 2. How testing was executed

- **Unit/integration (Vitest + in-memory Firestore)** — `tests/dashboard.test.ts` (34), `tests/edge-cases.test.ts` (70), `tests/roles-access.test.ts` (16), `tests/lifecycle.test.ts` (42 — **new**: complete task lifecycle, deadline engine, requests, finance ledger, billing, share links, careers).
- **Browser E2E (Playwright + real Firebase)** — `e2e/` (45 tests): real logins via Firebase Auth, session reuse per role (storageState), all three workspaces + public pages.
- **Live-DB verification** — admin SDK scripts (`scripts/qa-*.mjs`) cross-checked Firestore docs after UI actions (tasks, users, payments written by the UI were re-read and field-checked).

## 3. What was verified working (highlights)

- **Auth**: login page, wrong-password error, unauth redirects, role→home routing (admin→/admin, manager→/manager, employee→/dashboard, accountant→/admin/payments).
- **Role boundaries**: employee→/admin/*, employee→/manager/*, manager→/admin*, manager→/admin/payments, manager→/dashboard — all bounced correctly; **server-side**, not just UI hiding.
- **Employee**: task list/detail, own pay visible, submission link + quote, client access limited to assigned (unassigned = real 404), read-only calendar.
- **Manager**: task create (no pay field), client assignment via AssignSelect (live save), calendar modal (editable date+time + worker select), team stats, monthly reports (no finance), review controls; **no quote UI — verified** (recent fix).
- **Admin**: KPIs, add-employee (real error messages now), clients+payouts+payments+expenses+reports+jobs all render and write correctly.
- **Task lifecycle** (unit): create→submit→PENDING review→approve; changes→reopen+note→resubmit; reject; quote PENDING→approve/decline; stranger-submit blocked; double-submit blocked; javascript: URL rejected.
- **Deadline engine**: overdue→MISSED+strike (idempotent), late flag, missReason owner-only, waive 1/all, +24h grace on rejected-overdue, IST move keeps wall-clock time.
- **Finance** (unit): payment record→received→follow-up→delete, bad month/zero rejected, MANAGER+EMPLOYEE blocked, billing keeps previousFee, finance settings admin-only, dharam, share link snapshot + 90-day expiry.
- **Public**: homepage, careers lists live job, health endpoint.
- **Lazy engines confirmed live**: `ensureMonthlyCharges` auto-created retainer invoices for the QA client on payments-page load.

## 4. Bugs found & fixed

| ID | Sev | Bug | Status |
|---|---|---|---|
| QA-01 | High | Managers couldn't assign/add clients (`requireAdmin`) + no assign UI on /manager/clients | **Fixed earlier** (`requireAdminOrManager` + AssignSelect); regression-tested |
| QA-02 | High | Manager saw pay quotes + could approve (`reviewTaskPay` adminOrManager) | **Fixed earlier** — UI hidden + `requireAdmin`; E2E verified absent |
| QA-03 | Med | Calendar assign modal: deadline was hidden hardcoded 18:00 (no time input) | **Fixed earlier** — editable datetime-local (default 6 PM); E2E verified |
| QA-04 | Med | addEmployee hid real Firebase errors behind "email may already exist" (weak password, invalid email); orphan Auth user on profile-write failure | **Fixed earlier** — real error mapping + pre-check + rollback; unit-tested |
| QA-05 | Low | Employee couldn't see pay until submitting | **Fixed earlier** — "Pays ₹X" in task header; E2E verified |
| QA-06 | Med | Test infra: fake-db batch lacked `set`; `Timestamp.fromMillis` missing | Fixed in `tests/fake-db.ts` |

## 5. Known limitations / not a bug

- **No notifications system exists** — task requests surface via nav badge counts only; no email/push. (Requirement would be a new feature.)
- **No Firebase Storage** — "documents" are external links (Canva etc.) + logo uploads to `public/uploads` (local disk — **won't persist on Vercel**; see recommendations).
- Rate limiter is per-instance in-memory — on Vercel multi-lambda it softens.
- Session cookie cached 60s — role changes take up to a minute to apply.

## 6. Security notes

- Session cookies: httpOnly + checkRevoked on logout (token revocation).
- `safeHref` strips javascript:/data: URLs; `javascript:` submission rejected (unit-verified).
- Public endpoints rate-limited; applications dedupe per email+role.
- ⚠️ `.env` on this machine has no `NEXT_PUBLIC_*`/service-account vars — app relies on `service-account.json` fallback + hardcoded client config. Works, but document it.
- `firebase-tools` not installed → Firestore **security rules could not be inspected**; all data access is server-side via Admin SDK anyway (rules bypassed by design).

## 7. Test data created (kept per instructions — do NOT delete)

See `TEST_DATA_MANIFEST.md` for the full manifest.

## 8. Recommendations

1. Move client-logo uploads to Firebase Storage or an external bucket — `public/uploads` is ephemeral on serverless.
2. Consider a notifications table + badge feed (manager ↔ employee) — currently requests are the only channel.
3. `employees` page: no delete-user UI — only the `del-user.ts` script; acceptable but document.
4. Composite index note: all queries are single-field by design — fine at this scale.
5. Keep `e2e/.auth` gitignored (contains session cookies).
