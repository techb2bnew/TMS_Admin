"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type CreateTeamMemberInput = {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "dispatcher" | "accountant";
};

export type CreateTeamMemberResult =
  | {
      ok: true;
      member: {
        id: string;
        full_name: string;
        email: string;
        role: "admin" | "dispatcher" | "accountant";
        created_at: string;
      };
    }
  | { ok: false; error: string };

export async function createTeamMemberAction(input: CreateTeamMemberInput): Promise<CreateTeamMemberResult> {
  const supabase = createAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? "Could not create account" };
  }

  const userId = created.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: input.role,
    full_name: input.full_name,
    email: input.email,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  return {
    ok: true,
    member: {
      id: userId,
      full_name: input.full_name,
      email: input.email,
      role: input.role,
      created_at: new Date().toISOString(),
    },
  };
}
