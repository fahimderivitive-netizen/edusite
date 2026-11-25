-- Phase 9 migration (idempotent). Run after phase8.sql.
-- Course card pictures, instructor name and an optional "original price" for discount display.
-- All additions are nullable/optional, so the currently deployed site keeps working before and after this runs.

alter table courses add column if not exists thumbnail_path text; -- already added in phase 1; kept for safety
alter table courses add column if not exists instructor_name text;
alter table courses add column if not exists original_price numeric;
alter table courses drop constraint if exists courses_original_price_ok;
alter table courses add constraint courses_original_price_ok check (original_price is null or original_price >= price);
alter table courses drop constraint if exists courses_instructor_len;
alter table courses add constraint courses_instructor_len check (instructor_name is null or char_length(instructor_name) <= 80);

-- Public bucket: thumbnails are meant to be seen by everyone. Only content staff can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-thumbnails', 'course-thumbnails', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "course-thumbnails staff all" on storage.objects;
create policy "course-thumbnails staff all" on storage.objects for all to authenticated
  using (bucket_id = 'course-thumbnails' and has_scope('content'))
  with check (bucket_id = 'course-thumbnails' and has_scope('content'));
