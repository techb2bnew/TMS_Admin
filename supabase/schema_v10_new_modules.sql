-- TMS Database Schema v10 — new Admin modules: Rates (InstaRate), Carriers,
-- Trailers (Assets), Locations, Load Tenders (EDI/Tenders inbox), Feedback,
-- Messages (admin <-> driver chat).
-- Run this in the Supabase SQL Editor after schema_v9_truck_capacity_guard.sql.
--
-- NOT included here: multi-branch support (the "All Branches" switcher seen
-- in AscendTMS). That needs a branch_id column + rewritten RLS on every
-- existing table, which is a much bigger, riskier change — do it as its own
-- migration once the modules below are in and working.
--
-- Fully idempotent — safe to run more than once.

-- ============================================================
-- 1. RATE SETTINGS (InstaRate calculator defaults)
-- Single row, editable from Admin > Rates > InstaRate.
-- ============================================================
create table if not exists rate_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  line_haul_rate numeric not null default 1.98,
  fuel_surcharge_rate numeric not null default 0.50,
  additional_stop_rate numeric not null default 75.00,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);
insert into rate_settings (id) values ('00000000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;

-- ============================================================
-- 2. CARRIERS (outside/brokered carriers — separate from your own trucks/drivers)
-- ============================================================
create table if not exists carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mc_number text,
  dot_number text,
  contact_person text,
  phone text,
  email text,
  insurance_expiry date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. TRAILERS (Assets — paired with existing `trucks` table)
-- ============================================================
create table if not exists trailers (
  id uuid primary key default gen_random_uuid(),
  trailer_number text not null unique,
  type text not null default 'dry_van' check (type in ('dry_van', 'reefer', 'flatbed')),
  capacity_kg numeric,
  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. LOCATIONS (saved pickup/drop/yard addresses, reusable across loads)
-- ============================================================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text,
  state text,
  lat numeric not null default 0,
  lng numeric not null default 0,
  type text not null default 'other' check (type in ('pickup', 'drop', 'yard', 'other')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. LOAD TENDERS (EDI/Tenders inbox — incoming load offers to accept/reject)
-- `raw_payload` keeps the original EDI/API payload for later parsing once a
-- real EDI integration is wired up; for now tenders can also be added manually.
-- ============================================================
create table if not exists load_tenders (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual' check (source in ('manual', 'edi')),
  customer_name text not null,
  pickup_location text not null,
  drop_location text not null,
  rate numeric,
  weight_kg numeric,
  truck_type text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  raw_payload jsonb,
  received_at timestamptz not null default now(),
  responded_by uuid references profiles(id),
  responded_at timestamptz
);

-- ============================================================
-- 6. FEEDBACK (Help/Feedback module)
-- ============================================================
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id),
  message text not null,
  category text not null default 'other' check (category in ('bug', 'feature_request', 'other')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. MESSAGES (admin <-> driver chat)
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id),
  recipient_id uuid not null references profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table rate_settings enable row level security;
alter table carriers enable row level security;
alter table trailers enable row level security;
alter table locations enable row level security;
alter table load_tenders enable row level security;
alter table feedback enable row level security;
alter table messages enable row level security;

drop policy if exists "rate_settings_backoffice_all" on rate_settings;
create policy "rate_settings_backoffice_all" on rate_settings for all
  using (current_role_is('admin') or current_role_is('dispatcher') or current_role_is('accountant'))
  with check (current_role_is('admin') or current_role_is('dispatcher') or current_role_is('accountant'));

drop policy if exists "carriers_backoffice_all" on carriers;
create policy "carriers_backoffice_all" on carriers for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

drop policy if exists "trailers_backoffice_all" on trailers;
create policy "trailers_backoffice_all" on trailers for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

drop policy if exists "locations_backoffice_all" on locations;
create policy "locations_backoffice_all" on locations for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

drop policy if exists "load_tenders_backoffice_all" on load_tenders;
create policy "load_tenders_backoffice_all" on load_tenders for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

-- feedback: anyone signed in (driver or back-office) can send their own;
-- back-office can read/resolve all; a driver can read their own submissions.
drop policy if exists "feedback_insert_own" on feedback;
create policy "feedback_insert_own" on feedback for insert
  with check (created_by = auth.uid());
drop policy if exists "feedback_select_own" on feedback;
create policy "feedback_select_own" on feedback for select
  using (created_by = auth.uid());
drop policy if exists "feedback_backoffice_all" on feedback;
create policy "feedback_backoffice_all" on feedback for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

-- messages: only the two participants in a thread can see/send
drop policy if exists "messages_participants_select" on messages;
create policy "messages_participants_select" on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "messages_participants_insert" on messages;
create policy "messages_participants_insert" on messages for insert
  with check (sender_id = auth.uid());
drop policy if exists "messages_recipient_update" on messages;
create policy "messages_recipient_update" on messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'load_tenders'
  ) then
    alter publication supabase_realtime add table load_tenders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

notify pgrst, 'reload schema';
