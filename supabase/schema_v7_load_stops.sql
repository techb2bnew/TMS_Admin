-- TMS Database Schema v7 — real route/stops for the driver app (was mock
-- data keyed by load number, no backend table existed for this before).
-- Run this in the Supabase SQL Editor after schema_v6_assignment_guard.sql.
--
-- Fully idempotent — safe to run more than once.

create table if not exists load_stops (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  type text not null check (type in ('pickup', 'waypoint', 'drop')),
  label text not null,
  address text not null,
  city text not null default '',
  contact_name text,
  contact_phone text,
  eta timestamptz,
  distance_from_prev_km numeric not null default 0,
  status text not null default 'upcoming' check (status in ('completed', 'current', 'upcoming')),
  lat numeric not null default 0,
  lng numeric not null default 0,
  notes text,
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table load_stops enable row level security;

-- Admin/dispatch plan the real route (waypoints, distances, ETAs) for a load.
drop policy if exists "load_stops_backoffice_all" on load_stops;
create policy "load_stops_backoffice_all" on load_stops for all
  using (current_role_is('admin') or current_role_is('dispatcher'))
  with check (current_role_is('admin') or current_role_is('dispatcher'));

-- Driver reads stops for their own assigned loads, and can add their own
-- ad-hoc waypoint (fuel/rest/breakdown) — never a pickup/drop, those are
-- dispatch-owned.
drop policy if exists "load_stops_driver_select" on load_stops;
create policy "load_stops_driver_select" on load_stops for select
  using (exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid()));

drop policy if exists "load_stops_driver_insert_waypoint" on load_stops;
create policy "load_stops_driver_insert_waypoint" on load_stops for insert
  with check (
    type = 'waypoint'
    and exists (select 1 from loads where loads.id = load_id and loads.assigned_driver_id = auth.uid())
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'load_stops'
  ) then
    alter publication supabase_realtime add table load_stops;
  end if;
end $$;

-- Every load automatically gets a pickup + drop stop from its own
-- pickup_location/drop_location, so a route always exists even before
-- dispatch adds any real waypoints/distances/ETAs.
create or replace function seed_load_stops()
returns trigger
language plpgsql
as $$
begin
  insert into load_stops (load_id, type, label, address, sort_order)
  values
    (new.id, 'pickup', 'Pickup', new.pickup_location, 0),
    (new.id, 'drop', 'Drop-off', new.drop_location, 999);
  return new;
end;
$$;

drop trigger if exists trg_seed_load_stops on loads;
create trigger trg_seed_load_stops
after insert on loads
for each row execute function seed_load_stops();

-- Backfill pickup/drop stops for loads created before this migration ran.
insert into load_stops (load_id, type, label, address, sort_order)
select id, 'pickup', 'Pickup', pickup_location, 0
from loads
where not exists (select 1 from load_stops where load_stops.load_id = loads.id);

insert into load_stops (load_id, type, label, address, sort_order)
select id, 'drop', 'Drop-off', drop_location, 999
from loads
where not exists (
  select 1 from load_stops where load_stops.load_id = loads.id and load_stops.type = 'drop'
);

notify pgrst, 'reload schema';
