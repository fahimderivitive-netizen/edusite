-- Phase 1 migration (idempotent). Run once in the Supabase SQL Editor, after schema.sql + policies.sql.
-- Run this BEFORE deploying the Phase 1 code: the app now selects the *_bn columns.

-- Roles: student | moderator | admin, plus per-moderator scopes (content | qna | support)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('student','moderator','admin'));
alter table profiles add column if not exists mod_scopes text[] not null default '{}';

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'))
$$;

create or replace function has_scope(s text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and (role = 'admin' or (role = 'moderator' and s = any(mod_scopes)))
  )
$$;

-- Bangla content columns (UI falls back to the English column when null)
alter table courses add column if not exists title_bn text;
alter table courses add column if not exists description_bn text;
alter table courses add column if not exists thumbnail_path text;
alter table modules add column if not exists title_bn text;
alter table lessons add column if not exists title_bn text;
alter table lessons add column if not exists duration_sec int;

-- Prices are BDT from now on
alter table courses drop constraint if exists courses_price_nonneg;
alter table courses add constraint courses_price_nonneg check (price >= 0);

-- Lesson content type, backfilled once from existing raw URLs
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'lessons' and column_name = 'content_type') then
    alter table lessons add column content_type text not null default 'video'
      check (content_type in ('video','video_pdf','pdf','text'));
    update lessons set content_type = case
      when video_url is not null and pdf_url is not null then 'video_pdf'
      when pdf_url is not null then 'pdf'
      when video_url is not null then 'video'
      else 'text' end;
  end if;
end $$;

-- Outline view gains the new display columns (appended, so existing columns keep their order)
create or replace view lesson_outline as
  select l.id, l.module_id, l.title, l.is_free_preview, l.position,
         l.title_bn, l.content_type, l.duration_sec
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  where c.published;
grant select on lesson_outline to anon, authenticated;

-- Private media pointers (Bunny video id, storage path). Staff only; students get signed URLs from the server in Phase 3.
create table if not exists lesson_media (
  lesson_id uuid primary key references lessons on delete cascade,
  video_id text,
  pdf_path text
);
alter table lesson_media enable row level security;
drop policy if exists "lesson_media staff all" on lesson_media;
create policy "lesson_media staff all" on lesson_media for all
  using (has_scope('content')) with check (has_scope('content'));
revoke all on lesson_media from anon;
grant select, insert, update, delete on lesson_media to authenticated;

-- Enrollment: paid courses can no longer be self-enrolled. Self-enroll is for free published courses only;
-- paid enrollments will be inserted server-side after verified SSLCommerz validation (Phase 4).
alter table enrollments add column if not exists source text not null default 'free'
  check (source in ('free','payment','admin'));
drop policy if exists "enrollments self insert" on enrollments;
drop policy if exists "enrollments free self insert" on enrollments;
create policy "enrollments free self insert" on enrollments for insert with check (
  user_id = auth.uid()
  and source = 'free'
  and exists (select 1 from courses c where c.id = course_id and c.published and c.price = 0)
);
