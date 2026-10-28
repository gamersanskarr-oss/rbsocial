"use client";

import { useActionState, useState } from "react";
import { useActionToast } from "@/components/toast";
import { addEmployee, type ActionState } from "@/app/actions/admin";

const initial: ActionState = {};

export default function AddEmployeeForm() {
  const [state, formAction, pending] = useActionState(addEmployee, initial);
  useActionToast(state);
  const [role, setRole] = useState("EMPLOYEE");

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Temporary password</label>
          <input name="password" type="text" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Role</label>
          <select
            name="role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Social Media Manager</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
        </div>
        {role === "EMPLOYEE" && (
          <div>
            <label className="mb-1 block text-sm text-muted">Team</label>
            <select name="team" required className="input">
              <option value="DESIGN">Graphic Design</option>
              <option value="IT">IT Team</option>
            </select>
          </div>
        )}
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
