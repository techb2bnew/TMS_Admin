-- TMS Database Schema v11 — a driver couldn't find an admin to message,
-- because the profiles RLS only let a driver see their own row (admins
-- could see everyone, which is why this never showed up when testing as
-- admin). This adds a narrow read-only policy: any signed-in user can see
-- profile rows whose role is 'admin' (needed so the driver app's Messages
-- screen can find who to chat with) — driver-to-driver profiles stay private.
-- Run this in the Supabase SQL Editor after schema_v10_new_modules.sql.
--
-- Fully idempotent — safe to run more than once.

drop policy if exists "profiles_select_admin_contact" on profiles;
create policy "profiles_select_admin_contact" on profiles for select
  using (role = 'admin');

notify pgrst, 'reload schema';
