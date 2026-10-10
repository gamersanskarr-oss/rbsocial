import Link from "next/link";
import { listRequestsWithRefs } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { resolveRequest } from "@/app/actions/requests";

export default async function RequestsView({ basePath }: { basePath: string }) {
  const requests = await listRequestsWithRefs();

  const open = requests.filter((r) => r.status === "OPEN");
  const resolved = requests.filter((r) => r.status === "RESOLVED");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Requests"
        subtitle={`${open.length} open request${open.length === 1 ? "" : "s"} from your team.`}
      />

      <div className="space-y-3">
        {requests.length === 0 && (
          <div className="card p-10 text-center text-sm font-medium text-faint">
            No requests yet. When an employee needs something (like a logo or details) for a task,
            it will show up here.
          </div>
        )}
        {open.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-line">
                    Waiting
                  </span>
                  <Link
                    href={`${basePath}/tasks`}
                    className="text-sm font-bold text-ink hover:underline"
                  >
                    {r.task.topic}
                  </Link>
                  <span className="text-xs font-medium text-faint">
                    {r.task.client.name} · by {r.task.assignedTo.name}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-ink">{r.message}</p>
                <p className="mt-1.5 text-xs font-medium text-faint">
                  {r.createdAt?.toLocaleDateString()}{" "}
                  {r.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <form action={resolveRequest}>
                <input type="hidden" name="requestId" value={r.id} />
                <button className="btn-primary">Mark Resolved</button>
              </form>
            </div>
          </div>
        ))}
        {resolved.map((r) => (
          <div key={r.id} className="card p-5 opacity-70">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok ring-1 ring-inset ring-ok-line">
                    Resolved
                  </span>
                  <span className="text-sm font-bold text-ink">{r.task.topic}</span>
                  <span className="text-xs font-medium text-faint">
                    {r.task.client.name} · by {r.task.assignedTo.name}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-muted">{r.message}</p>
              </div>
              {r.resolvedAt && (
                <span className="text-xs font-medium text-faint">
                  resolved {r.resolvedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
