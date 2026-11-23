-- Phase 3 migration (idempotent). Run after phase2.sql.

-- Phone number (used for the anti-piracy watermark), copied from signup metadata
alter table profiles add column if not exists phone text;
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;

-- Device/session limit. Written only by the server (service role); users may read their own rows.
create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  device_id text not null,
  label text,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (user_id, device_id)
);
alter table user_sessions enable row level security;
drop policy if exists "user_sessions read own" on user_sessions;
create policy "user_sessions read own" on user_sessions for select using (user_id = auth.uid() or is_admin());
revoke all on user_sessions from anon;
grant select on user_sessions to authenticated;

-- Move raw media URLs into the private lesson_media table, then remove them from lessons
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lessons' and column_name = 'video_url') then
    insert into lesson_media (lesson_id, video_id)
      select id, video_url from lessons where video_url is not null
      on conflict (lesson_id) do update set video_id = coalesce(lesson_media.video_id, excluded.video_id);
    alter table lessons drop column video_url;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lessons' and column_name = 'pdf_url') then
    alter table lessons drop column pdf_url;
  end if;
end $$;
