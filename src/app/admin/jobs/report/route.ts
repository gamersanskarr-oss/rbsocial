import { requireAdmin } from "@/lib/auth";
import { listJobApplications } from "@/lib/data";

const csv = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  await requireAdmin();

  const jobId = new URL(req.url).searchParams.get("job") ?? "";
  let apps = await listJobApplications();
  if (jobId) apps = apps.filter((a) => a.jobId === jobId);

  const label = jobId ? (apps[0]?.jobTitle ?? "role") : "all-roles";

  const rows: string[] = [
    csv("RB Social Branding — Job Applications"),
    [csv("Role"), csv(jobId ? label : "All")].join(","),
    "",
    [
      csv("Name"), csv("Applied for"), csv("Email"), csv("Phone"),
      csv("Portfolio"), csv("Note"), csv("Received"), csv("Status"),
    ].join(","),
    ...apps.map((a) =>
      [
        csv(a.name),
        csv(a.jobTitle),
        csv(a.email),
        csv(a.phone),
        csv(a.portfolio),
        csv(a.message),
        csv(
          a.createdAt
            ? `${a.createdAt.toLocaleDateString("en-IN")} ${a.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : ""
        ),
        csv(a.status === "NEW" ? "New" : "Reviewed"),
      ].join(",")
    ),
    "",
    [csv("Total applications"), csv(apps.length)].join(","),
    [csv("Generated"), csv(new Date().toLocaleString("en-IN"))].join(","),
  ];

  const file = `applications-${label.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
