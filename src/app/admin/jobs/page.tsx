import { listJobApplications, listJobs } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { deleteJob, toggleJob } from "@/app/actions/admin";
import { deleteJobApplication, markApplicationReviewed } from "@/app/actions/careers";
import { PageHeader } from "@/components/ui";
import { ToastForm } from "@/components/toast";
import AddJobForm from "./add-job-form";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

const TEAM_LABEL: Record<string, string> = {
  DESIGN: "Graphic Design",
  IT: "IT",
  MARKETING: "Marketing",
  OPS: "Operations",
};

export default async function JobsPage() {
  await requireAdmin();
  const [jobs, applications] = await Promise.all([listJobs(), listJobApplications()]);
  const live = jobs.filter((j) => j.active).length;
  const newApps = applications.filter((a) => a.status === "NEW").length;
  const appCount = new Map<string, number>();
  for (const a of applications) appCount.set(a.jobId, (appCount.get(a.jobId) ?? 0) + 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jobs"
        subtitle="Publish openings — they appear instantly on the public careers page."
      />

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-bold text-ink">Publish a job</h2>
        <AddJobForm />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-panel/70 px-5 py-3.5">
          <h2 className="text-sm font-bold text-ink">All openings ({jobs.length})</h2>
          <span className="text-xs font-semibold text-muted">
            <span className="text-ok">{live} live</span> · {jobs.length - live} paused
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Role</th>
                <th className="th">Team</th>
                <th className="th">Type</th>
                <th className="th">Location</th>
                <th className="th">Status</th>
                <th className="th w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="td py-10 text-center text-faint">
                    No jobs yet — publish the first opening above.
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="transition hover:bg-panel/60">
                  <td className="td">
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="text-xs font-medium text-faint">
                      {j.salary ? `${j.salary} · ` : ""}
                      {appCount.get(j.id) ?? 0} application{(appCount.get(j.id) ?? 0) === 1 ? "" : "s"}
                      {(appCount.get(j.id) ?? 0) > 0 && (
                        <>
                          {" · "}
                          <a href={`/admin/jobs/report?job=${j.id}`} download className="link">
                            Excel ↓
                          </a>
                        </>
                      )}
                    </p>
                  </td>
                  <td className="td text-muted">{TEAM_LABEL[j.team ?? ""] ?? j.team}</td>
                  <td className="td text-muted">{TYPE_LABEL[j.type] ?? j.type}</td>
                  <td className="td text-muted">{j.location}</td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        j.active
                          ? "bg-ok-soft text-ok ring-ok-line"
                          : "bg-panel text-muted ring-line"
                      }`}
                    >
                      {j.active ? "Live" : "Paused"}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <ToastForm action={toggleJob} success={j.active ? "Job paused." : "Job published."}>
                        <input type="hidden" name="jobId" value={j.id} />
                        <button className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel">
                          {j.active ? "Pause" : "Publish"}
                        </button>
                      </ToastForm>
                      <ToastForm action={deleteJob} success="Job deleted.">
                        <input type="hidden" name="jobId" value={j.id} />
                        <button className="rounded-lg px-2 py-1.5 text-xs font-semibold text-faint transition hover:bg-hover hover:text-rose-500">
                          Delete
                        </button>
                      </ToastForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applications — submitted from the public careers page */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-panel/70 px-5 py-3.5">
          <h2 className="text-sm font-bold text-ink">Applications ({applications.length})</h2>
          <div className="flex items-center gap-3">
            {newApps > 0 && (
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand ring-1 ring-inset ring-brand-line">
                {newApps} new
              </span>
            )}
            <a
              href="/admin/jobs/report"
              download
              className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
            >
              Excel ↓
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Applicant</th>
                <th className="th">Applied for</th>
                <th className="th">Contact</th>
                <th className="th">Note</th>
                <th className="th">Received</th>
                <th className="th">Status</th>
                <th className="th w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="td py-10 text-center text-faint">
                    No applications yet — they'll land here when someone applies on /careers.
                  </td>
                </tr>
              )}
              {applications.map((a) => (
                <tr key={a.id} className="align-top transition hover:bg-panel/60">
                  <td className="td">
                    <p className="font-semibold text-ink">{a.name}</p>
                    {a.portfolio && (
                      <a
                        href={a.portfolio.startsWith("http") ? a.portfolio : `https://${a.portfolio}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link text-xs"
                      >
                        Portfolio ↗
                      </a>
                    )}
                  </td>
                  <td className="td font-medium text-muted">{a.jobTitle}</td>
                  <td className="td text-muted">
                    <p>{a.email}</p>
                    {a.phone && <p className="text-xs text-faint">{a.phone}</p>}
                  </td>
                  <td className="td max-w-56">
                    <p className="truncate text-xs text-muted" title={a.message ?? ""}>
                      {a.message ?? "—"}
                    </p>
                  </td>
                  <td className="td whitespace-nowrap text-muted">
                    {a.createdAt?.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    }) ?? "—"}
                  </td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        a.status === "NEW"
                          ? "bg-brand-soft text-brand ring-brand-line"
                          : "bg-panel text-muted ring-line"
                      }`}
                    >
                      {a.status === "NEW" ? "New" : "Reviewed"}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <ToastForm action={markApplicationReviewed} success={a.status === "NEW" ? "Marked as reviewed." : "Reopened — back to New."}>
                        <input type="hidden" name="applicationId" value={a.id} />
                        <button className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel">
                          {a.status === "NEW" ? "Reviewed" : "Reopen"}
                        </button>
                      </ToastForm>
                      <ToastForm action={deleteJobApplication} success="Application deleted.">
                        <input type="hidden" name="applicationId" value={a.id} />
                        <button className="rounded-lg px-2 py-1.5 text-xs font-semibold text-faint transition hover:bg-hover hover:text-rose-500">
                          Del
                        </button>
                      </ToastForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
