import { requireEmployee } from "@/lib/auth";
import { getUser, listTasksForUser } from "@/lib/data";
import { computeEarnings } from "@/lib/earnings";
import { PageHeader } from "@/components/ui";
import EarningsPanel from "../earnings-panel";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const user = await requireEmployee();
  const [fresh, myTasks] = await Promise.all([getUser(user.id), listTasksForUser(user.id)]);
  const summary = computeEarnings(myTasks, fresh?.perPostPay ?? null, fresh?.missedDeadlines ?? 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings"
        subtitle="Approved earnings, pending approvals and your month-wise work log."
      />
      <EarningsPanel
        name={user.name}
        totalEarned={summary.totalEarned}
        pendingAmount={summary.pendingAmount}
        monthly={summary.monthly}
        rows={summary.rows}
      />
    </div>
  );
}
