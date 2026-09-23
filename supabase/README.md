# Supabase — Admin

This is the source-of-truth schema for the whole TMS (used by both Admin and TMSDriver).

## Setup (run once)

1. Go to your Supabase project → **SQL Editor** → New query.
2. Paste `schema.sql` and run it. This creates all tables, RLS policies, and enables realtime.
3. Copy your project's URL + anon key (Project Settings → API) into `admin/.env.local`
   (copy from `admin/.env.local.example`).

## Notes

- Admin role (`profiles.role = 'admin'`) has full access to every table.
- When Admin creates a driver (Drivers module), it should also create the matching
  `auth.users` account + `profiles` row (`role = 'driver'`) + `drivers` row, using the
  Supabase Admin API (service role key, server-side only — never expose it to the browser).
- TMSDriver app connects to this same Supabase project — see `TMSDriver/supabase/README.md`.
