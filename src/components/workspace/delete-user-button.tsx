"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/app/actions/admin";
import { useToast } from "@/components/toast";

/** Two-step destructive action: "Delete" -> inline Confirm/Cancel. The
    server action blocks deletion when safety rails fail (pending work,
    non-employee role, self-delete) and the error surfaces as a toast. */
export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title={`Delete ${userName}'s login and profile`}
        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition hover:bg-bad-soft hover:text-bad"
      >
        Delete
      </button>
    );
  }

  const confirm = () => {
    const fd = new FormData();
    fd.set("userId", userId);
    startTransition(async () => {
      try {
        const res = await deleteUser(fd);
        if (res?.error) {
          toast("error", res.error);
          setConfirming(false);
          return;
        }
        toast("success", `${userName} deleted.`);
        router.refresh();
      } catch {
        toast("error", "Could not delete the user — try again.");
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        title="Confirm deletion"
        className="whitespace-nowrap rounded-lg bg-bad-soft px-2 py-1 text-[11px] font-bold text-bad ring-1 ring-inset ring-bad-line transition hover:bg-bad-soft/60 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Confirm?"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition hover:bg-hover hover:text-ink"
      >
        Cancel
      </button>
    </span>
  );
}
