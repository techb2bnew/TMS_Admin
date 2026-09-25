"use client";

import { useEffect, useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import InviteTeamMemberForm from "@/components/forms/InviteTeamMemberForm";
import { PlusIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import type { TeamRole, TeamStatus, TeamUser } from "@/types";

const T = APP_TEXT.team;

const STATUS_STYLE: Record<TeamStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Invited: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
};

const DB_ROLE_TO_TEAM_ROLE: Record<string, TeamRole> = {
  admin: "Admin",
  dispatcher: "Dispatcher",
  accountant: "Accountant",
};

function TeamView() {
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { message, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .in("role", ["admin", "dispatcher", "accountant"])
        .order("created_at", { ascending: false });

      setMembers(
        (data ?? []).map((p) => ({
          id: p.id,
          name: p.full_name,
          email: p.email ?? "",
          role: DB_ROLE_TO_TEAM_ROLE[p.role] ?? "Dispatcher",
          status: "Active",
          addedAt: p.created_at,
        }))
      );
    }
    load();
  }, []);

  function handleInvite(member: TeamUser) {
    setMembers((prev) => [member, ...prev]);
    showToast(T.invitedToast);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle}
        action={
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium px-4 py-2.5 transition-all shadow-md shadow-blue-600/25 hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon className="w-4 h-4" />
            {T.inviteMember}
          </button>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs opacity-50 text-left bg-slate-50">
                <th className="font-medium px-5 py-3">{T.table.name}</th>
                <th className="font-medium px-5 py-3">{T.table.email}</th>
                <th className="font-medium px-5 py-3">{T.table.role}</th>
                <th className="font-medium px-5 py-3">{T.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{member.name}</td>
                  <td className="px-5 py-3.5 opacity-70">{member.email}</td>
                  <td className="px-5 py-3.5 opacity-70">{T.roles[member.role]}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLE[member.status]}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {T.statuses[member.status]}
                    </span>
                  </td>
                </tr>
              ))}

              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteTeamMemberForm open={showInviteForm} onClose={() => setShowInviteForm(false)} onAdd={handleInvite} />
      <Toast message={message} />
    </div>
  );
}

export default TeamView;
