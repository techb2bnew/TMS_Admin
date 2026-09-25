-- TMS Database Schema v3 — human-readable load numbers.
-- Run this in the Supabase SQL Editor AFTER schema.sql and schema_v2_admin_modules.sql.
-- The primary key `loads.id` stays a uuid (all foreign keys keep working);
-- this just adds a friendly "LD-1042" style label the UI displays instead.

alter table loads add column if not exists load_number text unique;

create sequence if not exists load_number_seq start 1042;

create or replace function set_load_number()
returns trigger
language plpgsql
as $$
begin
  if new.load_number is null then
    new.load_number := 'LD-' || nextval('load_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_load_number on loads;
create trigger trg_set_load_number
before insert on loads
for each row execute function set_load_number();

-- Backfill any rows already seeded before this migration ran.
update loads set load_number = 'LD-' || nextval('load_number_seq') where load_number is null;
