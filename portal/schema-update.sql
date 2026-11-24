-- ============================================================
-- Portal update: generated documents + security hardening.
-- If you ALREADY set up the portal: Supabase > SQL Editor > New query > paste this file > Run.
-- (New installs get these changes from schema.sql automatically.) Safe to run more than once.
-- ============================================================

-- 1. Documents generated inside the portal (no uploading)
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

-- 2. Two-step verification is REQUIRED for the admin once an authenticator app is enrolled:
--    a stolen admin password alone can no longer read or change anything.
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
     and ( coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
           or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified') );
$$;

-- 3. Input limits (defence in depth: oversized or abusive values are refused by the database itself)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_text_len') then
    alter table public.profiles add constraint profiles_text_len check (char_length(coalesce(full_name,'')) <= 120 and char_length(coalesce(company,'')) <= 160 and char_length(coalesce(phone,'')) <= 40); end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_text_len') then
    alter table public.projects add constraint projects_text_len check (char_length(name) <= 200 and char_length(coalesce(summary,'')) <= 4000); end if;
  if not exists (select 1 from pg_constraint where conname = 'milestones_text_len') then
    alter table public.milestones add constraint milestones_text_len check (char_length(title) <= 200); end if;
  if not exists (select 1 from pg_constraint where conname = 'updates_text_len') then
    alter table public.updates add constraint updates_text_len check (char_length(body) <= 4000); end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_text_len') then
    alter table public.invoices add constraint invoices_text_len check (char_length(number) <= 60 and char_length(coalesce(notes,'')) <= 2000 and jsonb_array_length(items) <= 100); end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_text_len') then
    alter table public.payments add constraint payments_text_len check (char_length(coalesce(method,'')) <= 40 and char_length(coalesce(reference,'')) <= 100); end if;
  if not exists (select 1 from pg_constraint where conname = 'files_text_len') then
    alter table public.files add constraint files_text_len check (char_length(name) <= 255); end if;
end $$;
