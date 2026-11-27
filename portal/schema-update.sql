-- ============================================================
-- Portal update: documents generated inside the portal (no uploading).
-- If you ALREADY set up the portal: Supabase > SQL Editor > New query > paste this file > Run.
-- (New installs get this from schema.sql automatically.) Safe to run more than once.
-- ============================================================
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  doc_type   text not null check (doc_type in ('quotation','agreement','receipt','reminder','handover','change','onboarding')),
  number     text not null,
  title      text not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint documents_size check (pg_column_size(data) < 200000),
  constraint documents_text_len check (char_length(number) <= 60 and char_length(title) <= 300)
);
create unique index if not exists documents_number_uidx on public.documents(number);
create index if not exists documents_client_idx on public.documents(client_id);
alter table public.documents enable row level security;
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists documents_admin on public.documents;
create policy documents_admin on public.documents for all using (public.is_admin()) with check (public.is_admin());
