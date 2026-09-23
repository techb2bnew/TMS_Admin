-- TMS Database Schema (Supabase / Postgres)
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Order matters: tables first, then RLS policies, then realtime.

-- ============================================================
-- 1. PROFILES
-- One row per auth.users user. role decides admin vs driver.
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'driver')),
  full_name text not null,
  phone text unique,
  email text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. DRIVERS
-- Extra details specific to driver profiles.
-- ============================================================
create table drivers (
  id uuid primary key references profiles(id) on delete cascade,
  license_number text,
  license_doc_url text,
  id_proof_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. TRUCKS
-- ============================================================
create table trucks (
  id uuid primary key default gen_random_uuid(),
  truck_number text not null unique,
  capacity_kg numeric,
  insurance_expiry date,
  last_maintenance date,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. LOADS
-- ============================================================
create table loads (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_contact text,
  pickup_location text not null,
  drop_location text not null,
  weight_kg numeric,
  rate numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_driver_id uuid references drivers(id),
  assigned_truck_id uuid references trucks(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

-- ============================================================
-- 5. LOAD STATUS HISTORY
-- Every status change is logged here for tracking/audit.
-- ============================================================
create table load_status_history (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  status text not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

-- ============================================================
-- 6. DRIVER LOCATIONS
-- One row per driver, overwritten on every GPS ping (live tracking).
-- ============================================================
create table driver_locations (
  driver_id uuid primary key references drivers(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. POD DOCUMENTS (Proof of Delivery)
-- ============================================================
create table pod_documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  file_url text not null,
  uploaded_by uuid references drivers(id),
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- 8. INVOICES (customer billing)
-- ============================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  amount numeric not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. SETTLEMENTS (driver payouts)
-- ============================================================
create table settlements (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  driver_id uuid not null references drivers(id),
  amount numeric not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- HELPER: current user's role (used by RLS policies below)
-- ============================================================
create or replace function current_role_is(target_role text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table drivers enable row level security;
alter table trucks enable row level security;
alter table loads enable row level security;
alter table load_status_history enable row level security;
alter table driver_locations enable row level security;
alter table pod_documents enable row level security;
alter table invoices enable row level security;
alter table settlements enable row level security;
alter table notifications enable row level security;

-- profiles: admin sees everyone, driver sees only self
create policy "profiles_select" on profiles for select
  using (current_role_is('admin') or id = auth.uid());
create policy "profiles_update_self_or_admin" on profiles for update
  using (current_role_is('admin') or id = auth.uid());
create policy "profiles_admin_insert" on profiles for insert
  with check (current_role_is('admin'));

-- drivers: admin full access, driver reads/updates own row
create policy "drivers_select" on drivers for select
  using (current_role_is('admin') or id = auth.uid());
create policy "drivers_admin_write" on drivers for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

-- trucks: admin only
create policy "trucks_admin_all" on trucks for all
  using (current_role_is('admin')) with check (current_role_is('admin'));
create policy "trucks_driver_read" on trucks for select
  using (current_role_is('driver'));

-- loads: admin full access, driver reads/updates only their assigned loads
create policy "loads_admin_all" on loads for all
  using (current_role_is('admin')) with check (current_role_is('admin'));
create policy "loads_driver_select" on loads for select
  using (assigned_driver_id = auth.uid());
create policy "loads_driver_update_status" on loads for update
  using (assigned_driver_id = auth.uid())
  with check (assigned_driver_id = auth.uid());

-- load_status_history: admin full access, driver can read/insert for own loads
create policy "load_history_admin_all" on load_status_history for all
  using (current_role_is('admin')) with check (current_role_is('admin'));
create policy "load_history_driver_select" on load_status_history for select
  using (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));
create policy "load_history_driver_insert" on load_status_history for insert
  with check (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));

-- driver_locations: admin reads all, driver writes/reads own
create policy "locations_admin_select" on driver_locations for select
  using (current_role_is('admin') or driver_id = auth.uid());
create policy "locations_driver_upsert" on driver_locations for insert
  with check (driver_id = auth.uid());
create policy "locations_driver_update" on driver_locations for update
  using (driver_id = auth.uid());

-- pod_documents: admin reads all, driver uploads/reads for own loads
create policy "pod_admin_all" on pod_documents for all
  using (current_role_is('admin')) with check (current_role_is('admin'));
create policy "pod_driver_select" on pod_documents for select
  using (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));
create policy "pod_driver_insert" on pod_documents for insert
  with check (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));

-- invoices: admin only
create policy "invoices_admin_all" on invoices for all
  using (current_role_is('admin')) with check (current_role_is('admin'));

-- settlements: admin full access, driver reads own
create policy "settlements_admin_all" on settlements for all
  using (current_role_is('admin')) with check (current_role_is('admin'));
create policy "settlements_driver_select" on settlements for select
  using (driver_id = auth.uid());

-- notifications: each user sees only their own
create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (user_id = auth.uid());
create policy "notifications_admin_insert" on notifications for insert
  with check (current_role_is('admin'));

-- ============================================================
-- REALTIME
-- Enable realtime sync so both Admin dashboard and Driver app
-- get live updates without polling.
-- ============================================================
alter publication supabase_realtime add table loads;
alter publication supabase_realtime add table driver_locations;
alter publication supabase_realtime add table load_status_history;
alter publication supabase_realtime add table notifications;
