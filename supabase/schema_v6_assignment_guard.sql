-- TMS Database Schema v6 — enforce "one active load per driver/truck" at
-- the database level, not just in the Dispatch page's dropdown filtering.
-- Run this in the Supabase SQL Editor after schema_v5_driver_app.sql.
--
-- The Dispatch page already hides a busy driver/truck from the assign
-- dropdown, but this trigger is the real guarantee: it rejects the INSERT
-- or UPDATE outright if a driver or truck is already on another load with
-- status in ('assigned', 'picked_up', 'in_transit'), regardless of which
-- code path tried to make the assignment.

create or replace function enforce_single_active_load_per_driver_truck()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('assigned', 'picked_up', 'in_transit') then
    if new.assigned_driver_id is not null and exists (
      select 1 from loads
      where id <> new.id
        and assigned_driver_id = new.assigned_driver_id
        and status in ('assigned', 'picked_up', 'in_transit')
    ) then
      raise exception 'This driver is already on another active load';
    end if;

    if new.assigned_truck_id is not null and exists (
      select 1 from loads
      where id <> new.id
        and assigned_truck_id = new.assigned_truck_id
        and status in ('assigned', 'picked_up', 'in_transit')
    ) then
      raise exception 'This truck is already on another active load';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_single_active_load on loads;
create trigger trg_enforce_single_active_load
before insert or update on loads
for each row execute function enforce_single_active_load_per_driver_truck();
