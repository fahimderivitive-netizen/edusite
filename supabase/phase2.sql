-- Phase 2 migration (idempotent). Run after phase1.sql.

-- Table privileges for staff writes (RLS below decides who may actually write)
grant insert, update, delete on public.courses, public.modules, public.lessons to authenticated;
grant delete on public.enrollments to authenticated;

-- Content-scope moderators (and admins) manage courses/modules/lessons
drop policy if exists "courses read" on courses;
create policy "courses read" on courses for select using (published or has_scope('content'));
drop policy if exists "courses admin insert" on courses;
drop policy if exists "courses admin update" on courses;
drop policy if exists "courses admin delete" on courses;
drop policy if exists "courses staff insert" on courses;
drop policy if exists "courses staff update" on courses;
drop policy if exists "courses staff delete" on courses;
create policy "courses staff insert" on courses for insert with check (has_scope('content'));
create policy "courses staff update" on courses for update using (has_scope('content')) with check (has_scope('content'));
create policy "courses staff delete" on courses for delete using (has_scope('content'));

drop policy if exists "modules read" on modules;
create policy "modules read" on modules for select using (
  has_scope('content') or exists (select 1 from courses c where c.id = course_id and c.published)
);
drop policy if exists "modules admin insert" on modules;
drop policy if exists "modules admin update" on modules;
drop policy if exists "modules admin delete" on modules;
drop policy if exists "modules staff insert" on modules;
drop policy if exists "modules staff update" on modules;
drop policy if exists "modules staff delete" on modules;
create policy "modules staff insert" on modules for insert with check (has_scope('content'));
create policy "modules staff update" on modules for update using (has_scope('content')) with check (has_scope('content'));
create policy "modules staff delete" on modules for delete using (has_scope('content'));

drop policy if exists "lessons read" on lessons;
create policy "lessons read" on lessons for select using (
  has_scope('content')
  or exists (
    select 1 from modules m join courses c on c.id = m.course_id
    where m.id = module_id and c.published
      and (is_free_preview or exists (
        select 1 from enrollments e where e.course_id = c.id and e.user_id = auth.uid()))
  )
);
drop policy if exists "lessons admin insert" on lessons;
drop policy if exists "lessons admin update" on lessons;
drop policy if exists "lessons admin delete" on lessons;
drop policy if exists "lessons staff insert" on lessons;
drop policy if exists "lessons staff update" on lessons;
drop policy if exists "lessons staff delete" on lessons;
create policy "lessons staff insert" on lessons for insert with check (has_scope('content'));
create policy "lessons staff update" on lessons for update using (has_scope('content')) with check (has_scope('content'));
create policy "lessons staff delete" on lessons for delete using (has_scope('content'));

-- Staff can see profiles (names) for moderation queues
drop policy if exists "profiles staff read" on profiles;
create policy "profiles staff read" on profiles for select using (is_staff());

-- Private storage buckets. Students never get storage policies: the server signs short-lived URLs after an access check.
insert into storage.buckets (id, name, public) values
  ('lecture-pdfs', 'lecture-pdfs', false),
  ('answer-uploads', 'answer-uploads', false),
  ('doubt-media', 'doubt-media', false)
on conflict (id) do nothing;

drop policy if exists "lecture-pdfs staff all" on storage.objects;
create policy "lecture-pdfs staff all" on storage.objects for all to authenticated
  using (bucket_id = 'lecture-pdfs' and has_scope('content'))
  with check (bucket_id = 'lecture-pdfs' and has_scope('content'));
