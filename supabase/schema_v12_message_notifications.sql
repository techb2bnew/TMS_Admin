-- TMS Database Schema v12 — a chat message (admin <-> driver, schema_v10)
-- now also drops a row into `notifications` for whoever received it, so it
-- shows up in the existing bell/badge (both apps already have this wired up
-- for load-assignment notifications — this reuses the exact same table).
--
-- security definer, same reasoning as schema_v8: the driver app must be able
-- to notify an admin, and vice versa, regardless of each side's own RLS on
-- `notifications` (drivers can't normally write admin-owned rows, or vice
-- versa).
--
-- Note: this is an in-app notification only (bell icon + badge inside the
-- app). It does NOT push an OS-level alert when the app is closed/backgrounded
-- — that needs a separate push setup (FCM/APNs + device token registration),
-- which is a bigger, separate piece of work if you want it too.
--
-- Run this in the Supabase SQL Editor after schema_v11_messages_admin_visibility.sql.
-- Fully idempotent — safe to run more than once.

create or replace function notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  select full_name into sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, title, message)
  values (
    new.recipient_id,
    'New message from ' || coalesce(sender_name, 'someone'),
    left(new.body, 140)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_on_new_message on messages;
create trigger trg_notify_on_new_message
after insert on messages
for each row execute function notify_on_new_message();

notify pgrst, 'reload schema';
