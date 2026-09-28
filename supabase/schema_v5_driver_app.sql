-- TMS Database Schema v5 — driver app: duty status logging + linking a
-- driver's expense claim to the load it was incurred on.
-- Run this in the Supabase SQL Editor AFTER schema.sql, schema_v2, schema_v3
-- and schema_v4 have already been run.
--
-- Fully idempotent — safe to run more than once, and every statement is
-- independent so an error partway through (e.g. a table that already
-- exists) never blocks a later, unrelated statement from running.

-- ============================================================
-- 1. EXPENSES: optional link to the load it was incurred on.
-- Placed first and on its own so it always applies even if something
-- below (duty_logs) has an issue.
-- ============================================================
alter table expenses add column if not exists load_id uuid references loads(id);

-- ============================================================
-- 2. DUTY LOGS
-- One row per duty-status change (off_duty/sleeper/driving/on_duty),
-- mirrors load_status_history's audit-trail shape. Current status = most
-- recent row for that driver.
-- ============================================================
create table if not exists duty_logs (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  status text not null check (status in ('off_duty', 'sleeper', 'driving', 'on_duty')),
  changed_at timestamptz not null default now()
);

alter table duty_logs enable row level security;

drop policy if exists "duty_logs_admin_select" on duty_logs;
create policy "duty_logs_admin_select" on duty_logs for select
  using (current_role_is('admin') or driver_id = auth.uid());

drop policy if exists "duty_logs_driver_insert" on duty_logs;
create policy "duty_logs_driver_insert" on duty_logs for insert
  with check (driver_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'duty_logs'
  ) then
    alter publication supabase_realtime add table duty_logs;
  end if;
end $$;

-- Refresh PostgREST's schema cache so the new column/table are usable
-- immediately, without waiting for its own auto-detection.
notify pgrst, 'reload schema';
