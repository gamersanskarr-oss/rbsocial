"use client";

import { assignClient } from "@/app/actions/admin";

export default function AssignSelect({
  clientId,
  currentId,
  designers,
}: {
  clientId: string;
  currentId: string | null;
  designers: { id: string; name: string }[];
}) {
  return (
    <form action={assignClient}>
      <input type="hidden" name="clientId" value={clientId} />
      <select
        name="assignedToId"
        defaultValue={currentId ?? ""}
        className="input w-44"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Unassigned</option>
        {designers.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </form>
  );
}
