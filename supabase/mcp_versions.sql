-- Brief #5 criterion 8: hosted get_identity(version) must return the exact
-- payload bytes of that version. Snapshots hold emitted items only, so store
-- the source payload alongside each version (append-only, same RLS as snapshot).
alter table public.library_versions
  add column if not exists payload jsonb;
