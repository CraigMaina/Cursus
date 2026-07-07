-- 20260707001300_storage_photos.sql
-- PRD 10 / 4.1: private 'progress-photos' bucket. Objects live under a per-user prefix
-- ({user_id}/...) and are reached only via signed URLs. RLS on storage.objects restricts
-- every operation to objects whose first path segment equals the caller's uid.

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do update set public = false;

-- storage.foldername(name) splits the object path on '/'; element 1 is the top folder,
-- which we require to be the caller's uid. auth.uid() is uuid, cast to text to compare.

drop policy if exists progress_photos_select_own on storage.objects;
create policy progress_photos_select_own on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_insert_own on storage.objects;
create policy progress_photos_insert_own on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_update_own on storage.objects;
create policy progress_photos_update_own on storage.objects
  for update using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists progress_photos_delete_own on storage.objects;
create policy progress_photos_delete_own on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
