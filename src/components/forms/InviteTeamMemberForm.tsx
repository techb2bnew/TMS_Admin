"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { isValidEmail } from "@/lib/validation";
import type { TeamRole, TeamUser } from "@/types";

const C = APP_TEXT.common;

const ROLES: TeamRole[] = ["Admin", "Dispatcher", "Accountant"];

type Errors = Partial<Record<"name" | "email", string>>;

type InviteTeamMemberFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (member: TeamUser) => void;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
    hasError ? "border-red-500" : "border-blue-600/10 dark:border-blue-400/10 focus:border-blue-600"
  }`;
}

export default function InviteTeamMemberForm({ open, onClose, onAdd }: InviteTeamMemberFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Dispatcher");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setRole("Dispatcher");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = C.required;
    if (!email.trim()) next.email = C.required;
    else if (!isValidEmail(email)) next.email = "Enter a valid email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const member: TeamUser = {
      id: `u${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: "Invited",
      addedAt: new Date().toISOString().slice(0, 10),
    };

    onAdd(member);
    setSubmitting(false);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Team Member"
      subtitle="They'll receive an email invite to join the dashboard"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {C.cancel}
          </button>
          <button
            type="submit"
            form="invite-team-member-form"
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? C.saving : "Send Invite"}
          </button>
        </>
      }
    >
      <form id="invite-team-member-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Nair"
            className={inputClass(Boolean(errors.name))}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={inputClass(Boolean(errors.email))}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className={inputClass(false)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
