-- Run once in the Supabase SQL Editor (idempotent), before seed.sql.

alter table courses add column if not exists category text;

-- Students may enroll themselves (no payment flow yet: any signed-in user can enroll in any published course).
drop policy if exists "enrollments self insert" on enrollments;
create policy "enrollments self insert" on enrollments for insert
  with check (user_id = auth.uid() and exists (select 1 from courses c where c.id = course_id and c.published));

-- Public curriculum outline (titles only, no video/content) so locked lessons can be listed.
create or replace view lesson_outline as
  select l.id, l.module_id, l.title, l.is_free_preview, l.position
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  where c.published;
grant select on lesson_outline to anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select on public.courses, public.modules, public.lessons, public.lesson_outline to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.enrollments to authenticated;