"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { isValidEmail } from "@/lib/validation";
import { createTeamMemberAction } from "@/lib/actions/team";
import type { TeamRole, TeamUser } from "@/types";

const C = APP_TEXT.common;

const ROLES: TeamRole[] = ["Admin", "Dispatcher", "Accountant"];
const ROLE_TO_DB: Record<TeamRole, "admin" | "dispatcher" | "accountant"> = {
  Admin: "admin",
  Dispatcher: "dispatcher",
  Accountant: "accountant",
};

type Errors = Partial<Record<"name" | "email" | "password", string>>;

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
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TeamRole>("Dispatcher");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("Dispatcher");
    setErrors({});
    setFormError("");
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
    if (!password.trim()) next.password = C.required;
    else if (password.length < 6) next.password = "Minimum 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    const result = await createTeamMemberAction({
      full_name: name.trim(),
      email: email.trim(),
      password,
      role: ROLE_TO_DB[role],
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    const member: TeamUser = {
      id: result.member.id,
      name: result.member.full_name,
      email: result.member.email,
      role,
      status: "Active",
      addedAt: result.member.created_at.slice(0, 10),
    };

    onAdd(member);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Team Member"
      subtitle="You set the login password — they sign in with these credentials"
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
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="name@company.com"
            autoCapitalize="none"
            className={inputClass(Boolean(errors.email))}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Login password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password for this member"
            className={inputClass(Boolean(errors.password))}
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
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

        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  );
}
