-- Arche UI — RLS + new-user handling (run after schema.sql, same editor).

-- ------------------------------------------------------- new-user handling
-- Auth sign-up creates the profile row automatically. The default username is
-- the email local part, sanitized to the username format, truncated to 40
-- chars, and deduplicated with a numeric suffix (Fix A) — a collision must
-- NEVER fail the sign-up. Display name prefers OAuth metadata (Fix C).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  candidate text;
  n integer := 1;
begin
  base_name := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9-]', '-', 'g'));
  base_name := trim(both '-' from base_name);
  base_name := substr(base_name, 1, 40);
  if length(base_name) < 3 then
    base_name := 'user-' || substr(new.id::text, 1, 8);
  end if;
  candidate := base_name;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := substr(base_name, 1, 40 - length(n::text) - 1) || '-' || n::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.libraries enable row level security;
alter table public.library_versions enable row level security;

-- profiles: owner-only reads/writes on the row itself (Fix B). Public reads go
-- through the public_profiles view above — never expose the full row (it holds
-- the registry token hash).
drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_owner_read on public.profiles;
create policy profiles_owner_read on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- applications: owner only
drop policy if exists applications_owner_all on public.applications;
create policy applications_owner_all on public.applications
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- libraries: owner all; public libraries readable by anyone
drop policy if exists libraries_owner_all on public.libraries;
create policy libraries_owner_all on public.libraries
  for all using (auth.uid() = owner) with check (auth.uid() = owner);
drop policy if exists libraries_public_read on public.libraries;
create policy libraries_public_read on public.libraries
  for select using (visibility = 'public');

-- library_versions: immutable (no update/delete policies, deliberately).
-- Readable by the library owner or anyone when the parent library is public.
-- Insert allowed only to the parent library's owner (the publish path uses the
-- service role, which bypasses RLS; this policy covers owner-held inserts).
drop policy if exists versions_owner_insert on public.library_versions;
create policy versions_owner_insert on public.library_versions
  for insert with check (
    exists (
      select 1 from public.libraries
      where libraries.id = library_versions.library_id
        and libraries.owner = auth.uid()
    )
  );
drop policy if exists versions_visible_read on public.library_versions;
create policy versions_visible_read on public.library_versions
  for select using (
    exists (
      select 1 from public.libraries
      where libraries.id = library_versions.library_id
        and (libraries.owner = auth.uid() or libraries.visibility = 'public')
    )
  );
