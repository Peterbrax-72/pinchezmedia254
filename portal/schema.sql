-- ============================================================
-- Pinchez Media 254 - Client Portal database (Supabase / Postgres)
-- Run this whole file once: Supabase dashboard > SQL Editor > New query > paste > Run
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  company     text,
  phone       text,
  role        text not null default 'client' check (role in ('client','admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  service     text,
  status      text not null default 'Planning' check (status in ('Planning','In progress','In review','Delivered','On hold')),
  progress    int  not null default 0 check (progress between 0 and 100),
  start_date  date,
  due_date    date,
  summary     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  status      text not null default 'pending' check (status in ('done','active','pending')),
  due_date    date,
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  number      text not null unique,
  issue_date  date not null default current_date,
  due_date    date not null,
  items       jsonb not null default '[]'::jsonb,   -- [{"description":"...","qty":1,"unit_price":25000}]
  subtotal    numeric(12,2) not null default 0,
  discount    numeric(12,2) not null default 0,
  vat         numeric(12,2) not null default 0,
  total       numeric(12,2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  method      text,
  reference   text,
  paid_on     date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  name         text not null,
  category     text not null default 'Deliverable' check (category in ('Deliverable','Quotation','Agreement','Invoice','Receipt','Guide','Other')),
  storage_path text not null,
  size         bigint,
  created_at   timestamptz not null default now()
);

create index if not exists projects_client_idx   on public.projects(client_id);
create index if not exists invoices_client_idx   on public.invoices(client_id);
create index if not exists files_client_idx      on public.files(client_id);
create index if not exists milestones_proj_idx   on public.milestones(project_id);
create index if not exists updates_proj_idx      on public.updates(project_id);
create index if not exists payments_inv_idx      on public.payments(invoice_id);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- create a profile automatically whenever an auth user is created
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- invoice totals with payments (RLS of the underlying tables applies)
create or replace view public.invoice_summary with (security_invoker = true) as
select i.*,
       coalesce(p.paid,0)                       as paid,
       greatest(i.total - coalesce(p.paid,0),0) as balance,
       case when i.total - coalesce(p.paid,0) <= 0 then 'Paid'
            when i.due_date < current_date      then 'Overdue'
            when coalesce(p.paid,0) > 0         then 'Part-paid'
            else 'Due' end                      as status
from public.invoices i
left join (select invoice_id, sum(amount) paid from public.payments group by invoice_id) p on p.invoice_id = i.id;

-- ---------- row level security ----------
alter table public.profiles   enable row level security;
alter table public.projects   enable row level security;
alter table public.milestones enable row level security;
alter table public.updates    enable row level security;
alter table public.invoices   enable row level security;
alter table public.payments   enable row level security;
alter table public.files      enable row level security;

-- profiles: a client sees and edits only their own (cannot change role); admin sees and edits all
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'client');
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- hardening: clients can change only their name, company and phone (never email or role)
revoke update on public.profiles from authenticated;
grant update (full_name, company, phone) on public.profiles to authenticated;

-- projects / invoices / files: client reads own rows; admin does everything
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists projects_admin on public.projects;
create policy projects_admin  on public.projects for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists invoices_admin on public.invoices;
create policy invoices_admin  on public.invoices for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists files_select on public.files;
create policy files_select    on public.files    for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists files_admin on public.files;
create policy files_admin     on public.files    for all using (public.is_admin()) with check (public.is_admin());

-- milestones / updates: visible when the parent project is the client's
drop policy if exists milestones_select on public.milestones;
create policy milestones_select on public.milestones for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or public.is_admin())));
drop policy if exists milestones_admin on public.milestones;
create policy milestones_admin  on public.milestones for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists updates_select on public.updates;
create policy updates_select on public.updates for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or public.is_admin())));
drop policy if exists updates_admin on public.updates;
create policy updates_admin  on public.updates for all using (public.is_admin()) with check (public.is_admin());

-- payments: visible when the parent invoice is the client's
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (
  exists (select 1 from public.invoices i where i.id = invoice_id and (i.client_id = auth.uid() or public.is_admin())));
drop policy if exists payments_admin on public.payments;
create policy payments_admin  on public.payments for all using (public.is_admin()) with check (public.is_admin());

-- ---------- private file storage ----------
insert into storage.buckets (id, name, public) values ('client-files','client-files', false)
on conflict (id) do nothing;

-- files live at  <client-uuid>/<filename>.  A client may only read their own folder.
drop policy if exists "client reads own files" on storage.objects;
create policy "client reads own files" on storage.objects for select
  using (bucket_id = 'client-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "admin uploads files" on storage.objects;
create policy "admin uploads files" on storage.objects for insert
  with check (bucket_id = 'client-files' and public.is_admin());
drop policy if exists "admin updates files" on storage.objects;
create policy "admin updates files" on storage.objects for update
  using (bucket_id = 'client-files' and public.is_admin());
drop policy if exists "admin deletes files" on storage.objects;
create policy "admin deletes files" on storage.objects for delete
  using (bucket_id = 'client-files' and public.is_admin());

-- ============================================================
-- AFTER running this file:
-- 1. Authentication > Providers > Email: turn OFF "Allow new users to sign up" (so only you create clients).
-- 2. Create your own login: Authentication > Users > Add user (your email + a strong password).
-- 3. Make yourself admin (replace the email):
--      update public.profiles set role = 'admin' where email = 'sirpeterbaraka@gmail.com';
-- ============================================================
