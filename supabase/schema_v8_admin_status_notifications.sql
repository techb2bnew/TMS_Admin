-- TMS Database Schema v8 — notify every admin whenever a driver changes a
-- load's status (picked up, in transit, delivered, etc.).
-- Run this in the Supabase SQL Editor after schema_v7_load_stops.sql.
--
-- security definer so it can insert into `notifications` for admin users
-- regardless of the calling driver's own RLS — the driver app never needs
-- to know who the admins are or have permission to write to their rows.

create or replace function notify_admins_on_load_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and auth.uid() = new.assigned_driver_id then
    insert into notifications (user_id, title, message)
    select id,
      'Load status updated',
      'Load ' || new.load_number || ' is now ' || new.status
    from profiles
    where role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_on_load_status on loads;
create trigger trg_notify_admins_on_load_status
after update on loads
for each row execute function notify_admins_on_load_status_change();
