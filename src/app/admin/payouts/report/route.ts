import { requireAdmin } from "@/lib/auth";
import { getUser, taskPay, tasksDueBetween } from "@/lib/data";
import {
  BONUS_GRACE_MISSES,
  MISSED_DEADLINE_LIMIT,
  PAYOUT_BONUS,
  PAYOUT_REDUCTION,
  payoutStatus,
} from "@/lib/deadlines";

const csv = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};

const dt = (d: Date | null) =>
  d
    ? `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "";

export async function GET(req: Request) {
  await requireAdmin(); // redirects out non-admins

  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employee") ?? "";
  const match = /^(\d{4})-(\d{2})$/.exec(url.searchParams.get("month") ?? "");

  const now = new Date();
  const monthStart = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const monthLabel = monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const emp = await getUser(employeeId);
  if (!emp) return new Response("Employee not found", { status: 404 });

  const tasks = (await tasksDueBetween(monthStart, monthEnd)).filter(
    (t) => t.assignedToId === emp.id
  );

  const rate = emp.perPostPay ?? 0;
  const done = tasks.filter((t) => t.status === "COMPLETED");
  const missed = tasks.filter((t) => t.status === "MISSED");
  const gross = done.reduce((s, t) => s + taskPay(t, rate), 0);
  const reduced = payoutStatus(emp.missedDeadlines).reduced;
  const deduction = reduced ? gross * PAYOUT_REDUCTION : 0;
  const bonus = !reduced && missed.length <= BONUS_GRACE_MISSES ? gross * PAYOUT_BONUS : 0;
  const net = gross - deduction + bonus;

  const rows: string[] = [
    csv("RB Social Branding — Work Report"),
    "",
    [csv("Employee"), csv(emp.name)].join(","),
    [csv("Email"), csv(emp.email)].join(","),
    [csv("Team"), csv(emp.team ?? "")].join(","),
    [csv("Month"), csv(monthLabel)].join(","),
    "",
    [
      csv("Topic"), csv("Client"), csv("Type"), csv("Slides"), csv("Deadline"),
      csv("Status"), csv("Submitted"), csv("Amount (₹)"),
    ].join(","),
    ...tasks.map((t) =>
      [
        csv(t.topic),
        csv(t.client.name),
        csv(t.type ?? ""),
        csv(t.slideCount ?? ""),
        csv(dt(t.deadline)),
        csv(t.status),
        csv(dt(t.completedAt)),
        csv(t.status === "COMPLETED" ? taskPay(t, rate) : ""),
      ].join(",")
    ),
    "",
    [csv("Tasks due"), csv(tasks.length)].join(","),
    [csv("Completed"), csv(done.length)].join(","),
    [csv("Missed"), csv(missed.length)].join(","),
    [csv("Strikes (all-time)"), csv(`${emp.missedDeadlines}/${MISSED_DEADLINE_LIMIT}`)].join(","),
    [csv("Gross (₹)"), csv(gross)].join(","),
    [csv(`Deduction ${PAYOUT_REDUCTION * 100}% (₹)`), csv(deduction || "")].join(","),
    [csv(`On-time bonus ${PAYOUT_BONUS * 100}% (₹)`), csv(bonus || "")].join(","),
    [csv("Net payable (₹)"), csv(net)].join(","),
    "",
    [csv("Generated"), csv(dt(new Date()))].join(","),
  ];

  const file = `work-report-${emp.name.replace(/\s+/g, "-").toLowerCase()}-${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}.csv`;

  return new Response(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
