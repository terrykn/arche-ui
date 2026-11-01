-- Arche UI — Brief #3 Milestone 1 schema.
-- Run once in Supabase Studio > SQL editor (or supabase db push).
-- Table naming keeps `library` internally per Brief #3 Rule 7; the UI says "Identity".
-- Snapshots live as JSONB on library_versions (not Storage): snapshots are a
-- few hundred KB of JSON, version rows are append-only, and JSONB keeps the
-- snapshot in the same RLS-governed row as its version metadata — no second
-- bucket policy surface to keep in sync.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  registry_token_hash text,
  registry_token_prefix text,
  registry_token_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
);

-- ------------------------------------------------------------ applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- libraries
create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  name text not null,
  slug text not null,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint libraries_slug_per_owner unique (owner, slug)
);

-- --------------------------------------------------------- library_versions
create table if not exists public.library_versions (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  version integer not null,
  payload_hash text not null,
  snapshot jsonb not null,
  published_at timestamptz not null default now(),
  constraint library_versions_unique unique (library_id, version)
);
create index if not exists library_versions_library_idx
  on public.library_versions (library_id, version desc);

-- ------------------------------------------------------- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();
drop trigger if exists libraries_touch on public.libraries;
create trigger libraries_touch before update on public.libraries
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------- new-user handling
-- Auth sign-up creates the profile row automatically; the username defaults
-- to the email local part and can be changed in settings (unique).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
begin
  base_name := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9-]', '-', 'g'));
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(base_name, ''), 'user-' || substr(new.id::text, 1, 8)),
    split_part(new.email, '@', 1)
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

-- profiles: readable by anyone (usernames feed /p/<user> routes), editable by owner only
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles
  for select using (true);
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

-- library_versions: immutable (no update/delete policies). Readable by the
-- library owner or anyone when the parent library is public. Insert allowed
-- only to the parent library's owner (publish path uses the service role,
-- which bypasses RLS; this policy covers any owner-held client inserts).
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
