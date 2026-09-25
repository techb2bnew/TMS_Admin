-- TMS Database Schema v2 — Admin modules (Customers, Check Calls, Expenses,
-- Load Templates, Load Documents)
-- Run this in the Supabase SQL Editor AFTER schema.sql has already been run.
-- Order matters: tables first, then column/constraint changes, then RLS, then realtime.

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  billing_address text,
  payment_terms text not null default 'Net 30' check (payment_terms in ('Net 15', 'Net 30', 'Due on receipt')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. CHECK CALLS
-- Dispatcher notes logged against a load (separate from the automatic
-- status-change log in load_status_history).
-- ============================================================
create table check_calls (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  note text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. EXPENSES
-- Admin-entered expenses default to 'approved'. Driver-submitted claims
-- (a later driver-app feature) will default to 'pending' for admin review.
-- ============================================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Fuel', 'Tolls', 'Maintenance', 'Insurance', 'Other')),
  amount numeric not null,
  truck_id uuid references trucks(id),
  date date not null default current_date,
  notes text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. LOAD TEMPLATES
-- ============================================================
create table load_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_id uuid references customers(id),
  pickup_location text not null,
  drop_location text not null,
  default_rate numeric,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. LOAD DOCUMENTS
-- Rate confirmations / BOLs attached by dispatch — separate from
-- pod_documents (proof of delivery, uploaded by the driver).
-- ============================================================
create table load_documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  file_url text not null,
  type text not null check (type in ('rate_confirmation', 'bol', 'other')),
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- EXISTING TABLE CHANGES
-- ============================================================

-- profiles: allow the new back-office roles used by the Team module.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'driver', 'dispatcher', 'accountant'));

-- loads: link to a real customer record instead of free-text only.
-- customer_name/customer_contact are kept as-is for backward compatibility.
alter table loads add column if not exists customer_id uuid references customers(id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table customers enable row level security;
alter table check_calls enable row level security;
alter table expenses enable row level security;
alter table load_templates enable row level security;
alter table load_documents enable row level security;

-- customers: back-office roles only
create policy "customers_backoffice_all" on customers for all
  using (current_role_is('admin') or current_role_is('dispatcher') or current_role_is('accountant'))
  with check (current_role_is('admin') or current_role_is('dispatcher') or current_role_is('accountant'));

-- check_calls: back-office roles only (internal dispatcher notes)
create policy "check_calls_backoffice_all" on check_calls for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

-- expenses: admin/accountant full access; driver can submit and read own claims
create policy "expenses_backoffice_all" on expenses for all
  using (current_role_is('admin') or current_role_is('accountant'))
  with check (current_role_is('admin') or current_role_is('accountant'));
create policy "expenses_driver_insert" on expenses for insert
  with check (current_role_is('driver') and created_by = auth.uid());
create policy "expenses_driver_select" on expenses for select
  using (created_by = auth.uid());

-- load_templates: admin/dispatcher only
create policy "load_templates_backoffice_all" on load_templates for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

-- load_documents: admin/dispatcher manage; driver reads docs for their own assigned loads
create policy "load_documents_backoffice_all" on load_documents for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));
create policy "load_documents_driver_select" on load_documents for select
  using (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table check_calls;
alter publication supabase_realtime add table load_documents;
