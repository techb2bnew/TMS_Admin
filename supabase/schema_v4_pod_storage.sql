-- TMS Database Schema v4 — storage bucket for driver-uploaded
-- proof-of-delivery photos.
-- Run this in the Supabase SQL Editor AFTER schema.sql and
-- schema_v2_admin_modules.sql. Bucket is public so both the driver app and
-- the admin dashboard can just render `pod_documents.file_url` directly.

insert into storage.buckets (id, name, public)
values ('pod-photos', 'pod-photos', true)
on conflict (id) do nothing;

drop policy if exists "pod_photos_authenticated_upload" on storage.objects;
create policy "pod_photos_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'pod-photos' and auth.role() = 'authenticated');

drop policy if exists "pod_photos_public_read" on storage.objects;
create policy "pod_photos_public_read" on storage.objects for select
  using (bucket_id = 'pod-photos');
