-- Arche UI — Brief #6 Deliverable 2: generation logging/metering (run after schema.sql + schema_rls.sql).
-- One row per generation attempt, including failed ones (Rule 7). Provider
-- secrets never touch this table — only the model name and token counts.

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  library_id uuid references public.libraries (id) on delete set null,
  kind text not null check (kind in ('generate', 'edit')),
  prompt text,
  source_ref text,
  dna jsonb,
  dna_delta jsonb,
  payload_diff jsonb,
  adjustments jsonb,
  model text not null,
  tokens_in integer,
  tokens_out integer,
  status text not null check (status in ('ok', 'failed', 'capped')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists generation_logs_user_idx on public.generation_logs (user_id, created_at desc);
create index if not exists generation_logs_library_idx on public.generation_logs (library_id);

alter table public.generation_logs enable row level security;

-- Owner reads own rows only. Inserts go through the service role (server).
drop policy if exists generation_logs_owner_read on public.generation_logs;
create policy generation_logs_owner_read on public.generation_logs
  for select using (auth.uid() = user_id);

-- Private bucket for image-door uploads. sourceRef = storage key.
insert into storage.buckets (id, name, public)
values ('identity-source-images', 'identity-source-images', false)
on conflict (id) do nothing;

drop policy if exists source_images_owner_all on storage.objects;
create policy source_images_owner_all on storage.objects
  for all using (
    bucket_id = 'identity-source-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'identity-source-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
