"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/toast";
import { addJob, type ActionState } from "@/app/actions/admin";

const initial: ActionState = {};

export default function AddJobForm() {
  const [state, formAction, pending] = useActionState(addJob, initial);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="banner-error">{state.error}</p>}
      {state.success && <p className="banner-success">{state.success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Job title</label>
          <input name="title" required className="input" placeholder="Graphic Designer" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Location</label>
          <input name="location" required className="input" placeholder="Indore · Hybrid" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Team</label>
          <select name="team" required className="input" defaultValue="">
            <option value="" disabled>Select team</option>
            <option value="DESIGN">Graphic Design</option>
            <option value="IT">IT</option>
            <option value="MARKETING">Marketing</option>
            <option value="OPS">Operations</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Type</label>
          <select name="type" required className="input" defaultValue="">
            <option value="" disabled>Select type</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Salary range (optional)</label>
          <input name="salary" className="input" placeholder="₹15,000–25,000/mo" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Apply link (optional — email or URL)
          </label>
          <input
            name="applyLink"
            className="input"
            placeholder="careers@rbsocial.in or https://forms.gle/…"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          className="input"
          placeholder={"What the role involves — one point per line shows as bullets:\n· Design 15+ social posts a month\n· Own brand kits in Canva"}
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Publishing…" : "Publish Job"}
      </button>
    </form>
  );
}
