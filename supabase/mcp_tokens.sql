-- Arche UI — Brief #5 Deliverable 2: MCP tokens (run after schema.sql + schema_rls.sql).
-- Dedicated credential: MCP tokens read full payloads and edit/publish.
-- Never the registry token (different privilege). Hashed at rest, shown once.

create table if not exists public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null,
  label text not null default 'mcp',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mcp_tokens_user_idx on public.mcp_tokens (user_id);

alter table public.mcp_tokens enable row level security;

-- Owner can read their own token rows (hashes only — raw values never stored).
drop policy if exists mcp_tokens_owner_read on public.mcp_tokens;
create policy mcp_tokens_owner_read on public.mcp_tokens
  for select using (auth.uid() = user_id);

-- Owner inserts are only via the dashboard server action (service role);
-- this policy keeps headless inserts possible for the owner.
drop policy if exists mcp_tokens_owner_insert on public.mcp_tokens;
create policy mcp_tokens_owner_insert on public.mcp_tokens
  for insert with check (auth.uid() = user_id);
