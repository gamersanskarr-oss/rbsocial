import "server-only";
import { adminDb, FieldValue, overduePendingTasks } from "./data";

export const MISSED_DEADLINE_LIMIT = 3;
export const PAYOUT_REDUCTION = 0.1; // 10%
export const PAYOUT_BONUS = 0.1; // 10% monthly on-time bonus
export const BONUS_GRACE_MISSES = 1; // ≤1 missed deadline in the month still earns the bonus

// Scans for overdue pending tasks, marks them MISSED and bumps the
// assignee's missed-deadline counter. Called on dashboard/admin loads.
export async function checkMissedDeadlines() {
  const overdue = await overduePendingTasks();
  if (overdue.length === 0) return;

  const batch = adminDb.batch();
  for (const t of overdue) {
    batch.update(adminDb.collection("tasks").doc(t.id), { status: "MISSED" });
  }
  const counts = new Map<string, number>();
  for (const t of overdue) {
    counts.set(t.assignedToId, (counts.get(t.assignedToId) ?? 0) + 1);
  }
  for (const [userId, count] of counts) {
    // batch.update on a missing doc would reject the whole batch — skip
    // assignees whose user doc doesn't exist instead of losing the scan.
    const userRef = adminDb.collection("users").doc(userId);
    const u = await userRef.get();
    if (u.exists) {
      batch.update(userRef, { missedDeadlines: FieldValue.increment(count) });
    }
  }
  await batch.commit();
}

export function payoutStatus(missedDeadlines: number) {
  return missedDeadlines >= MISSED_DEADLINE_LIMIT
    ? { reduced: true, percent: PAYOUT_REDUCTION * 100 }
    : { reduced: false, percent: 0 };
}
