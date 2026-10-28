"use client";

import { useActionState, useState } from "react";
import { useActionToast } from "@/components/toast";
import { createShareLink, type FinState } from "@/app/actions/finance";

const initial: FinState = {};

export default function ShareButton({ horizon }: { horizon: string }) {
  const [state, formAction, pending] = useActionState(createShareLink, initial);
  useActionToast(state);
  const [copied, setCopied] = useState(false);
  const fullUrl = state.shareUrl ? `${window.location.origin}${state.shareUrl}` : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="horizon" value={horizon} />
        <button disabled={pending} className="btn-primary px-4 py-2 text-sm">
          {pending ? "Creating…" : "Create share link"}
        </button>
      </form>
      {fullUrl && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(fullUrl).catch(() => null);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel"
          title={fullUrl}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      )}
      {state.error && <p className="text-xs font-semibold text-bad">{state.error}</p>}
    </div>
  );
}
