import Link from "next/link";
import { notFound } from "next/navigation";
import { clientAssignees, getClient, listAssets, listTaskTypes, tasksByClient, userNameMap } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { StatusBadge } from "@/components/ui";
import { ClientLogo } from "@/components/client-logo";
import { deleteClientAsset } from "@/app/actions/clients";
import { updateClientBilling } from "@/app/actions/finance";
import { BILLING_MODELS } from "@/lib/constants";
import ClientDetailsForm from "./client-details-form";
import AssetForm from "./asset-form";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [client, assets, tasks, userNames, taskTypes] = await Promise.all([
    getClient(id),
    listAssets(id),
    tasksByClient(id),
    userNameMap(),
    listTaskTypes(),
  ]);
  if (!client) notFound();
  const assignedNames = clientAssignees(client).map(
    (uid) => userNames.get(uid) ?? "?"
  );

  const socials = [
    { label: "Instagram", url: client.instagram },
    { label: "Facebook", url: client.facebook },
    { label: "Website", url: client.website },
  ].filter((s) => s.url);

  return (
    <div className="space-y-8">
      <Link href="/admin/clients" className="inline-block text-sm font-semibold text-muted transition hover:text-ink">
        ← All clients
      </Link>

      <div className="card flex flex-wrap items-center gap-5 p-6">
        <ClientLogo url={client.logoUrl} name={client.name} size={72} rounded="rounded-2xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{client.name}</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            {client.contact ?? "No contact yet"} · Designer(s):{" "}
            {assignedNames.length ? assignedNames.join(", ") : "Unassigned"}
          </p>
          {client.requirements && client.requirements.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {client.requirements.map((r, i) => (
                <span
                  key={i}
                  className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand-line"
                >
                  {r.qty}× {r.type}/{r.per === "WEEK" ? "wk" : "mo"}
                </span>
              ))}
            </div>
          )}
        </div>
        {socials.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-line bg-elevated px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-5 text-sm font-bold text-ink">Basic details</h2>
          <ClientDetailsForm
            clientId={client.id}
            client={{
              name: client.name,
              contact: client.contact,
              phone: client.phone,
              instagram: client.instagram,
              facebook: client.facebook,
              website: client.website,
              notes: client.notes,
              requirements: client.requirements,
            }}
            taskTypes={taskTypes}
          />
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-sm font-bold text-ink">Billing &amp; retainer</h2>
          <p className="mb-4 text-sm font-medium text-muted">
            Set the monthly fee and billing cycle — a pending payment is auto-created each month.
          </p>
          <form action={updateClientBilling} className="space-y-4">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Monthly fee (₹)</label>
                <input
                  name="monthlyFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={client.monthlyFee ?? ""}
                  className="input"
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">
                  Billing day of month
                </label>
                <input
                  name="billingDay"
                  type="number"
                  min="1"
                  max="28"
                  defaultValue={client.billingDay ?? ""}
                  className="input"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Billing model</label>
                <select name="billingModel" defaultValue={client.billingModel ?? "PREPAID"} className="input">
                  {BILLING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Status</label>
                <select name="status" defaultValue={client.status ?? "ACTIVE"} className="input">
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            {client.previousMonthlyFee != null && (
              <p className="text-xs font-medium text-faint">
                Previous fee ₹{client.previousMonthlyFee.toLocaleString("en-IN")}
                {client.feeEffectiveFrom &&
                  ` · current rate effective ${client.feeEffectiveFrom.toLocaleDateString("en-IN")}`}
              </p>
            )}
            <button className="btn-secondary">Save billing</button>
          </form>
        </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-1 text-sm font-bold text-ink">Design elements &amp; assets</h2>
            <p className="mb-4 text-sm font-medium text-muted">
              Logo packs, fonts, templates — everything the designer needs. Visible to the
              assigned employee.
            </p>
            <AssetForm clientId={client.id} />
            <ul className="mt-4 space-y-2">
              {assets.length === 0 && (
                <li className="rounded-xl bg-panel/60 px-4 py-3 text-sm font-medium text-faint">
                  No assets yet — add the brand kit, logos, fonts…
                </li>
              )}
              {assets.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{a.name}</p>
                    <a href={a.url} target="_blank" rel="noreferrer" className="link block truncate text-xs">
                      {a.url} ↗
                    </a>
                  </div>
                  <form action={deleteClientAsset}>
                    <input type="hidden" name="assetId" value={a.id} />
                    <button
                      title="Delete asset"
                      className="rounded-lg p-1.5 text-faint transition hover:bg-hover hover:text-ink"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden>
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>

          {client.notes && (
            <div className="card p-6">
              <h2 className="mb-3 text-sm font-bold text-ink">Brand notes</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{client.notes}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="mb-3 text-sm font-bold text-ink">Tasks for this client</h2>
            <ul className="divide-y divide-line">
              {tasks.length === 0 && (
                <li className="py-3 text-sm font-medium text-faint">No tasks yet.</li>
              )}
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.topic}</p>
                    <p className="text-xs font-medium text-faint">{t.assignedTo.name}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
