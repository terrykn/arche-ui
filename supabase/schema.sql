-- Arche UI — Brief #3 Milestone 1 schema (with review fixes A–E applied).

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

-- Public-safe projection of profiles for /p/<user> routes (Fix B).
create or replace view public.public_profiles as
  select id, username, display_name from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ------------------------------------------------------------ applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_owner_idx
  on public.applications (owner);

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
-- One identity per application (Fix D).
create unique index if not exists libraries_one_per_application
  on public.libraries (application_id)
  where application_id is not null;

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
