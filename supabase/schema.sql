create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin'))
);
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  price numeric not null default 0,
  published boolean not null default false
);
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  position int not null default 0
);
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules on delete cascade,
  title text not null,
  video_url text,
  content_md text,
  pdf_url text,
  is_free_preview boolean not null default false,
  position int not null default 0
);
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;

-- profiles: own row or admin; role cannot be self-changed (admin only updates)
create policy "profiles read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles admin write" on profiles for update using (is_admin()) with check (is_admin());
create policy "profiles admin delete" on profiles for delete using (is_admin());

-- courses
create policy "courses read" on courses for select using (published or is_admin());
create policy "courses admin insert" on courses for insert with check (is_admin());
create policy "courses admin update" on courses for update using (is_admin()) with check (is_admin());
create policy "courses admin delete" on courses for delete using (is_admin());

-- modules: visible with their published course
create policy "modules read" on modules for select using (
  is_admin() or exists (select 1 from courses c where c.id = course_id and c.published)
);
create policy "modules admin insert" on modules for insert with check (is_admin());
create policy "modules admin update" on modules for update using (is_admin()) with check (is_admin());
create policy "modules admin delete" on modules for delete using (is_admin());

-- lessons: free previews, or enrolled in the course
create policy "lessons read" on lessons for select using (
  is_admin()
  or exists (
    select 1 from modules m join courses c on c.id = m.course_id
    where m.id = module_id and c.published
      and (is_free_preview or exists (
        select 1 from enrollments e where e.course_id = c.id and e.user_id = auth.uid()))
  )
);
create policy "lessons admin insert" on lessons for insert with check (is_admin());
create policy "lessons admin update" on lessons for update using (is_admin()) with check (is_admin());
create policy "lessons admin delete" on lessons for delete using (is_admin());

-- enrollments: students read own; only admins write
create policy "enrollments read" on enrollments for select using (user_id = auth.uid() or is_admin());
create policy "enrollments admin insert" on enrollments for insert with check (is_admin());
create policy "enrollments admin update" on enrollments for update using (is_admin()) with check (is_admin());
create policy "enrollments admin delete" on enrollments for delete using (is_admin());
