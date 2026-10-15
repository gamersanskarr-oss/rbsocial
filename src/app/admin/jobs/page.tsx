import { listJobs } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { deleteJob, toggleJob } from "@/app/actions/admin";
import { PageHeader } from "@/components/ui";
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
  const jobs = await listJobs();
  const live = jobs.filter((j) => j.active).length;

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
                    {j.salary && <p className="text-xs font-medium text-faint">{j.salary}</p>}
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
                      <form action={toggleJob}>
                        <input type="hidden" name="jobId" value={j.id} />
                        <button className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel">
                          {j.active ? "Pause" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteJob}>
                        <input type="hidden" name="jobId" value={j.id} />
                        <button className="rounded-lg px-2 py-1.5 text-xs font-semibold text-faint transition hover:bg-hover hover:text-rose-500">
                          Delete
                        </button>
                      </form>
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
