-- Phase 5 migration (idempotent). Run after phase4.sql.
-- Answer keys live in exam_keys (hidden until a student submits). MCQ grading runs inside Postgres
-- (submit_exam, security definer), so students can neither read keys early nor write their own score.

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  title_bn text,
  kind text not null default 'mcq' check (kind in ('mcq','written')),
  duration_min int not null default 30 check (duration_min > 0),
  negative_mark numeric not null default 0 check (negative_mark >= 0 and negative_mark <= 1), -- fraction of a question's marks lost per wrong answer
  instructions text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams on delete cascade,
  position int not null default 0,
  body text not null,
  body_bn text,
  options jsonb, -- mcq: [{"en": "...", "bn": "..."}]
  marks numeric not null default 1 check (marks > 0)
);
create table if not exists exam_keys (
  question_id uuid primary key references exam_questions on delete cascade,
  correct int, -- 0-based option index (mcq)
  solution text,
  solution_bn text
);
create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','expired','graded')),
  score numeric,
  total numeric,
  late boolean not null default false,
  answer_text text,
  answer_path text,
  feedback text,
  unique (exam_id, user_id)
);
create table if not exists exam_answers (
  attempt_id uuid not null references exam_attempts on delete cascade,
  question_id uuid not null references exam_questions on delete cascade,
  choice int,
  primary key (attempt_id, question_id)
);

alter table exams enable row level security;
alter table exam_questions enable row level security;
alter table exam_keys enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;

-- exams: enrolled students see published ones; content staff see and manage all
drop policy if exists "exams read" on exams;
create policy "exams read" on exams for select using (
  has_scope('content')
  or (published and exists (select 1 from enrollments e where e.course_id = exams.course_id and e.user_id = auth.uid()))
);
drop policy if exists "exams staff write" on exams;
create policy "exams staff write" on exams for all using (has_scope('content')) with check (has_scope('content'));

-- questions: only after the student has started an attempt
drop policy if exists "exam_questions read" on exam_questions;
create policy "exam_questions read" on exam_questions for select using (
  has_scope('content')
  or exists (select 1 from exam_attempts a where a.exam_id = exam_questions.exam_id and a.user_id = auth.uid())
);
drop policy if exists "exam_questions staff write" on exam_questions;
create policy "exam_questions staff write" on exam_questions for all using (has_scope('content')) with check (has_scope('content'));

-- keys: students only after they have submitted (or the attempt expired)
drop policy if exists "exam_keys read" on exam_keys;
create policy "exam_keys read" on exam_keys for select using (
  has_scope('content')
  or exists (
    select 1 from exam_questions q join exam_attempts a on a.exam_id = q.exam_id
    where q.id = exam_keys.question_id and a.user_id = auth.uid() and a.status in ('submitted','graded','expired')
  )
);
drop policy if exists "exam_keys staff write" on exam_keys;
create policy "exam_keys staff write" on exam_keys for all using (has_scope('content')) with check (has_scope('content'));

-- attempts: students start their own (no score), staff grade written work
drop policy if exists "exam_attempts read" on exam_attempts;
create policy "exam_attempts read" on exam_attempts for select using (user_id = auth.uid() or has_scope('content'));
drop policy if exists "exam_attempts start" on exam_attempts;
create policy "exam_attempts start" on exam_attempts for insert with check (
  user_id = auth.uid() and status = 'in_progress' and score is null and answer_text is null and answer_path is null
  and exists (select 1 from exams x where x.id = exam_id)
);
drop policy if exists "exam_attempts staff update" on exam_attempts;
create policy "exam_attempts staff update" on exam_attempts for update using (has_scope('content')) with check (has_scope('content'));

drop policy if exists "exam_answers read" on exam_answers;
create policy "exam_answers read" on exam_answers for select using (
  has_scope('content') or exists (select 1 from exam_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

revoke all on exams, exam_questions, exam_keys, exam_attempts, exam_answers from anon;
grant select on exams, exam_questions, exam_keys, exam_attempts, exam_answers to authenticated;
grant insert, update, delete on exams, exam_questions, exam_keys to authenticated;
grant insert, update on exam_attempts to authenticated;

-- Submit + grade. p_answers is a JSON object {"<question id>": <0-based choice>}.
create or replace function submit_exam(p_attempt uuid, p_answers jsonb default '{}'::jsonb, p_text text default null, p_path text default null)
returns table (score numeric, total numeric, late boolean)
language plpgsql security definer set search_path = public as $$
declare
  a exam_attempts; e exams; s numeric := 0; t numeric := 0; q record; ch int; is_late boolean;
begin
  select * into a from exam_attempts where id = p_attempt and user_id = auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'Already submitted'; end if;
  select * into e from exams where id = a.exam_id;
  is_late := now() > a.started_at + make_interval(mins => e.duration_min) + interval '30 seconds';
  select coalesce(sum(marks), 0) into t from exam_questions where exam_id = a.exam_id;

  if e.kind = 'mcq' then
    if not is_late then
      for q in select eq.id, eq.marks, k.correct from exam_questions eq join exam_keys k on k.question_id = eq.id where eq.exam_id = a.exam_id loop
        ch := nullif(p_answers ->> q.id::text, '')::int;
        if ch is not null then
          insert into exam_answers (attempt_id, question_id, choice) values (a.id, q.id, ch);
          if ch = q.correct then s := s + q.marks; else s := s - e.negative_mark * q.marks; end if;
        end if;
      end loop;
      s := greatest(s, 0);
    end if;
    update exam_attempts set status = case when is_late then 'expired' else 'submitted' end,
      submitted_at = now(), score = s, total = t, late = is_late where id = a.id;
    return query select s, t, is_late;
  else
    if p_path is not null and split_part(p_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid file path'; end if;
    update exam_attempts set status = 'submitted', submitted_at = now(), total = t, late = is_late,
      answer_text = left(p_text, 20000), answer_path = p_path where id = a.id;
    return query select null::numeric, t, is_late;
  end if;
end $$;
revoke all on function submit_exam(uuid, jsonb, text, text) from public;
grant execute on function submit_exam(uuid, jsonb, text, text) to authenticated;

-- Leaderboard (top 50) for students enrolled in the exam's course, and staff
create or replace function exam_leaderboard(p_exam uuid)
returns table (rank bigint, name text, score numeric, total numeric, is_me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by a.score desc), coalesce(p.full_name, 'Student'), a.score, a.total, a.user_id = auth.uid()
  from exam_attempts a join profiles p on p.id = a.user_id
  where a.exam_id = p_exam and a.status in ('submitted','graded') and a.score is not null
    and (has_scope('content') or exists (
      select 1 from enrollments en join exams e on e.course_id = en.course_id where e.id = p_exam and en.user_id = auth.uid()))
  order by 1, 2
  limit 50
$$;
grant execute on function exam_leaderboard(uuid) to authenticated;

-- Per-question accuracy for staff analytics
create or replace function exam_question_stats(p_exam uuid)
returns table (question_id uuid, answered bigint, correct_count bigint)
language sql stable security definer set search_path = public as $$
  select q.id, count(ans.choice), count(ans.choice) filter (where ans.choice = k.correct)
  from exam_questions q
  left join exam_keys k on k.question_id = q.id
  left join exam_answers ans on ans.question_id = q.id
  where q.exam_id = p_exam and has_scope('content')
  group by q.id
$$;
grant execute on function exam_question_stats(uuid) to authenticated;

-- Written answer uploads: students write only into their own folder; content staff can read them
drop policy if exists "answer-uploads own insert" on storage.objects;
create policy "answer-uploads own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'answer-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "answer-uploads read" on storage.objects;
create policy "answer-uploads read" on storage.objects for select to authenticated
  using (bucket_id = 'answer-uploads' and ((storage.foldername(name))[1] = auth.uid()::text or has_scope('content')));
