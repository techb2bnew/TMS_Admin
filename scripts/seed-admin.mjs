// One-off script: creates the real Supabase auth user + profiles row for the
// admin, using the same email/password the app used to hardcode. Run once:
//   node --env-file=.env.local scripts/seed-admin.mjs
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@tms.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "Admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.includes("already been registered")) {
      console.log("Admin auth user already exists — looking it up...");
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error("Could not find existing admin user by email");
      userId = existing.id;
    } else {
      throw createError;
    }
  } else {
    console.log("Created admin auth user:", userId);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, role: "admin", full_name: ADMIN_NAME, email: ADMIN_EMAIL }, { onConflict: "id" });

  if (profileError) throw profileError;

  console.log("Admin profile ready. Login with:");
  console.log("  email:   ", ADMIN_EMAIL);
  console.log("  password:", ADMIN_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
