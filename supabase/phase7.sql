-- Phase 7 migration (idempotent). Run after phase6.sql.
-- Users may edit their own profile (name, phone) but never their own role or moderator scopes.

alter table profiles drop constraint if exists profiles_name_len;
alter table profiles add constraint profiles_name_len check (full_name is null or char_length(full_name) <= 80);

drop policy if exists "profiles self update" on profiles;
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- RLS cannot restrict columns, so a trigger blocks privilege changes by anyone who is not an admin.
-- auth.uid() is null for the SQL editor and the service-role key, which stay allowed.
create or replace function guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin()
     and (new.role is distinct from old.role or new.mod_scopes is distinct from old.mod_scopes) then
    raise exception 'Not allowed to change role or scopes';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before update on profiles for each row execute function guard_profile_privileges();

