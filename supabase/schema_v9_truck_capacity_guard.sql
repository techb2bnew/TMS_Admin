-- TMS Database Schema v9 — reject assigning a truck whose capacity is
-- below the load's weight, at the database level (not just the Dispatch/
-- Loads dropdowns, which already hide a too-small truck as an option).
-- Run this in the Supabase SQL Editor after schema_v8_admin_status_notifications.sql.
--
-- Fully idempotent — safe to run more than once.

create or replace function enforce_truck_capacity()
returns trigger
language plpgsql
as $$
declare
  truck_capacity numeric;
begin
  if new.assigned_truck_id is not null then
    select capacity_kg into truck_capacity from trucks where id = new.assigned_truck_id;
    if truck_capacity is not null and new.weight_kg > truck_capacity then
      raise exception 'Load weight (% kg) exceeds this truck''s capacity (% kg)', new.weight_kg, truck_capacity;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_truck_capacity on loads;
create trigger trg_enforce_truck_capacity
before insert or update on loads
for each row execute function enforce_truck_capacity();
