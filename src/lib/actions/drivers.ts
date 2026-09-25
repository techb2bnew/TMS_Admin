"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type CreateDriverInput = {
  full_name: string;
  phone: string;
  email: string;
  license_number: string;
  password: string;
};

export type CreateDriverResult =
  | {
      ok: true;
      driver: {
        id: string;
        full_name: string;
        phone: string;
        license_number: string;
        status: "active";
        created_at: string;
      };
    }
  | { ok: false; error: string };

export async function createDriverAction(input: CreateDriverInput): Promise<CreateDriverResult> {
  const supabase = createAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? "Could not create driver account" };
  }

  const userId = created.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: "driver",
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  const { error: driverError } = await supabase
    .from("drivers")
    .insert({ id: userId, license_number: input.license_number, status: "active" });

  if (driverError) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: driverError.message };
  }

  return {
    ok: true,
    driver: {
      id: userId,
      full_name: input.full_name,
      phone: input.phone,
      license_number: input.license_number,
      status: "active",
      created_at: new Date().toISOString(),
    },
  };
}
