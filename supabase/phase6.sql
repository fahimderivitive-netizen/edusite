-- Phase 6 migration (idempotent). Run after phase5.sql.

-- Same visibility rule the lessons RLS policy uses, usable from other policies and security-definer functions
create or replace function can_view_lesson(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_scope('content') or exists (
    select 1 from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id
    where l.id = p_lesson and c.published
      and (l.is_free_preview or exists (select 1 from enrollments e where e.course_id = c.id and e.user_id = auth.uid()))
  )
$$;

-- Progress ---------------------------------------------------------------
create table if not exists lesson_progress (
  user_id uuid not null references profiles on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table lesson_progress enable row level security;
drop policy if exists "progress own read" on lesson_progress;
drop policy if exists "progress own insert" on lesson_progress;
drop policy if exists "progress own delete" on lesson_progress;
create policy "progress own read" on lesson_progress for select using (user_id = auth.uid());
create policy "progress own insert" on lesson_progress for insert with check (user_id = auth.uid() and can_view_lesson(lesson_id));
create policy "progress own delete" on lesson_progress for delete using (user_id = auth.uid());

-- Lesson comments (timestamps live in the text, e.g. "2:35"; first one is stored in video_ts_sec) ----
create table if not exists lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  parent_id uuid references lesson_comments on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  video_ts_sec int,
  created_at timestamptz not null default now()
);
alter table lesson_comments enable row level security;
drop policy if exists "comments read" on lesson_comments;
drop policy if exists "comments insert" on lesson_comments;
drop policy if exists "comments delete" on lesson_comments;
create policy "comments read" on lesson_comments for select using (can_view_lesson(lesson_id));
create policy "comments insert" on lesson_comments for insert with check (user_id = auth.uid() and can_view_lesson(lesson_id));
create policy "comments delete" on lesson_comments for delete using (user_id = auth.uid() or has_scope('qna'));

create or replace function lesson_comments_list(p_lesson uuid)
returns table (id uuid, parent_id uuid, body text, video_ts_sec int, created_at timestamptz, author text, from_staff boolean, mine boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.parent_id, c.body, c.video_ts_sec, c.created_at,
         coalesce(p.full_name, 'Student'), p.role in ('moderator','admin'), c.user_id = auth.uid()
  from lesson_comments c join profiles p on p.id = c.user_id
  where c.lesson_id = p_lesson and can_view_lesson(p_lesson)
  order by c.created_at
$$;
grant execute on function lesson_comments_list(uuid) to authenticated;

-- Doubts (text + photo + voice) ---------------------------------------------
create table if not exists doubts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  lesson_id uuid references lessons on delete set null,
  body text not null default '' check (char_length(body) <= 4000),
  image_path text,
  audio_path text,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (body <> '' or image_path is not null or audio_path is not null)
);
create table if not exists doubt_replies (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null references doubts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  image_path text,
  audio_path text,
  created_at timestamptz not null default now(),
  check (body <> '' or image_path is not null or audio_path is not null)
);
alter table doubts enable row level security;
alter table doubt_replies enable row level security;
drop policy if exists "doubts read" on doubts;
drop policy if exists "doubts insert" on doubts;
drop policy if exists "doubts staff update" on doubts;
create policy "doubts read" on doubts for select using (user_id = auth.uid() or has_scope('qna'));
create policy "doubts insert" on doubts for insert with check (user_id = auth.uid() and status = 'open');
create policy "doubts staff update" on doubts for update using (has_scope('qna')) with check (has_scope('qna'));
drop policy if exists "doubt_replies read" on doubt_replies;
drop policy if exists "doubt_replies insert" on doubt_replies;
create policy "doubt_replies read" on doubt_replies for select using (exists (select 1 from doubts d where d.id = doubt_id));
create policy "doubt_replies insert" on doubt_replies for insert with check (
  user_id = auth.uid() and exists (select 1 from doubts d where d.id = doubt_id and (d.user_id = auth.uid() or has_scope('qna')))
);

create or replace function on_doubt_reply() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update doubts d set updated_at = now(),
    status = case when new.user_id = d.user_id then 'open' else 'answered' end
  where d.id = new.doubt_id and d.status <> 'closed';
  return new;
end $$;
drop trigger if exists doubt_reply_status on doubt_replies;
create trigger doubt_reply_status after insert on doubt_replies for each row execute function on_doubt_reply();

create or replace function doubt_replies_list(p_doubt uuid)
returns table (id uuid, body text, image_path text, audio_path text, created_at timestamptz, author text, from_staff boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.body, r.image_path, r.audio_path, r.created_at, coalesce(p.full_name, 'User'), p.role in ('moderator','admin')
  from doubt_replies r join profiles p on p.id = r.user_id
  where r.doubt_id = p_doubt
    and (has_scope('qna') or exists (select 1 from doubts d where d.id = p_doubt and d.user_id = auth.uid()))
  order by r.created_at
$$;
grant execute on function doubt_replies_list(uuid) to authenticated;

drop policy if exists "doubt-media own insert" on storage.objects;
create policy "doubt-media own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'doubt-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "doubt-media read" on storage.objects;
create policy "doubt-media read" on storage.objects for select to authenticated
  using (bucket_id = 'doubt-media' and ((storage.foldername(name))[1] = auth.uid()::text or has_scope('qna')));

-- Support tickets ------------------------------------------------------------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  subject text not null check (char_length(subject) between 3 and 200),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  assignee_id uuid references profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
drop policy if exists "tickets read" on tickets;
drop policy if exists "tickets insert" on tickets;
drop policy if exists "tickets staff update" on tickets;
create policy "tickets read" on tickets for select using (user_id = auth.uid() or has_scope('support'));
create policy "tickets insert" on tickets for insert with check (user_id = auth.uid() and status = 'open' and assignee_id is null);
create policy "tickets staff update" on tickets for update using (has_scope('support')) with check (has_scope('support'));
drop policy if exists "ticket_messages read" on ticket_messages;
drop policy if exists "ticket_messages insert" on ticket_messages;
create policy "ticket_messages read" on ticket_messages for select using (exists (select 1 from tickets t where t.id = ticket_id));
create policy "ticket_messages insert" on ticket_messages for insert with check (
  user_id = auth.uid() and exists (select 1 from tickets t where t.id = ticket_id)
);

create or replace function on_ticket_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update tickets t set updated_at = now(),
    status = case when new.user_id = t.user_id and t.status = 'resolved' then 'open' else t.status end
  where t.id = new.ticket_id;
  return new;
end $$;
drop trigger if exists ticket_message_touch on ticket_messages;
create trigger ticket_message_touch after insert on ticket_messages for each row execute function on_ticket_message();

create or replace function ticket_thread(p_ticket uuid)
returns table (id uuid, body text, created_at timestamptz, author text, from_staff boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.body, m.created_at, coalesce(p.full_name, 'User'), p.role in ('moderator','admin')
  from ticket_messages m join profiles p on p.id = m.user_id
  where m.ticket_id = p_ticket
    and (has_scope('support') or exists (select 1 from tickets t where t.id = p_ticket and t.user_id = auth.uid()))
  order by m.created_at
$$;
grant execute on function ticket_thread(uuid) to authenticated;

revoke all on lesson_progress, lesson_comments, doubts, doubt_replies, tickets, ticket_messages from anon;
grant select, insert, delete on lesson_progress, lesson_comments to authenticated;
grant select, insert, update on doubts, tickets to authenticated;
grant select, insert on doubt_replies, ticket_messages to authenticated;

-- Storage hardening: allowed types and size limits for the private buckets
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav']
  where id = 'doubt-media';
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif','application/pdf']
  where id = 'answer-uploads';
update storage.buckets set file_size_limit = 26214400, allowed_mime_types = array['application/pdf']
  where id = 'lecture-pdfs';
