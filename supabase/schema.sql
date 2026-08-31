-- ============================================================
-- Cutly – Multi-tenant schema
-- Run this in the Supabase SQL editor.
-- Each authenticated user owns a Tenant; every row in business
-- tables is scoped to tenant_id and protected by RLS.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ------------------------------------------------------------
-- Tenants (multi-tenant root)
-- ------------------------------------------------------------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'مستاجر من',
  created_at timestamptz not null default now()
);

comment on table public.tenants is 'هر کاربر، یک مستاجر مستقل دارد.';

-- ------------------------------------------------------------
-- Profiles (نام، شغل، کارت بانکی)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  phone text,
  first_name text not null default '',
  last_name text not null default '',
  occupation text not null default '',
  bank_card_last4 text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Projects
-- ------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  parts jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{
    "sheetWidth": 2440,
    "sheetHeight": 1220,
    "kerf": 3.5,
    "trim": 10,
    "allowRotation": true
  }'::jsonb,
  result jsonb,
  status text not null default 'draft' check (status in ('draft', 'optimized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_tenant_idx on public.projects (tenant_id, updated_at desc);

-- ------------------------------------------------------------
-- Files (خروجی PDF و فایل‌های پروژه)
-- ------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  storage_path text not null,
  file_type text not null default 'pdf',
  name text not null default '',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index files_tenant_idx on public.files (tenant_id, created_at desc);

-- ------------------------------------------------------------
-- Subscriptions / Payments (ریالی و کارت به کارت)
-- ------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'monthly', 'yearly')),
  status text not null default 'incomplete' check (status in ('incomplete', 'active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_tenant_idx on public.subscriptions (tenant_id);

-- ------------------------------------------------------------
-- Helper: tenant of the current authenticated user
-- ------------------------------------------------------------
create or replace function public.current_tenant_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Trigger: create tenant + profile on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  insert into public.tenants (owner_id)
  values (new.id)
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, phone)
  values (new.id, v_tenant_id, new.phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.files enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "tenants_select_own" on public.tenants;
create policy "tenants_select_own"
  on public.tenants for select
  using (auth.uid() = owner_id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "projects_select_tenant" on public.projects;
create policy "projects_select_tenant"
  on public.projects for select
  using (tenant_id = public.current_tenant_id());

drop policy if exists "projects_insert_tenant" on public.projects;
create policy "projects_insert_tenant"
  on public.projects for insert
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "projects_update_tenant" on public.projects;
create policy "projects_update_tenant"
  on public.projects for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "projects_delete_tenant" on public.projects;
create policy "projects_delete_tenant"
  on public.projects for delete
  using (tenant_id = public.current_tenant_id());

drop policy if exists "files_select_tenant" on public.files;
create policy "files_select_tenant"
  on public.files for select
  using (tenant_id = public.current_tenant_id());

drop policy if exists "files_insert_tenant" on public.files;
create policy "files_insert_tenant"
  on public.files for insert
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "files_delete_tenant" on public.files;
create policy "files_delete_tenant"
  on public.files for delete
  using (tenant_id = public.current_tenant_id());

drop policy if exists "subscriptions_select_tenant" on public.subscriptions;
create policy "subscriptions_select_tenant"
  on public.subscriptions for select
  using (tenant_id = public.current_tenant_id());

drop policy if exists "subscriptions_insert_tenant" on public.subscriptions;
create policy "subscriptions_insert_tenant"
  on public.subscriptions for insert
  with check (tenant_id = public.current_tenant_id());

drop policy if exists "subscriptions_update_tenant" on public.subscriptions;
create policy "subscriptions_update_tenant"
  on public.subscriptions for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- ------------------------------------------------------------
-- Storage bucket for project files (PDF خروجی)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "files_tenant_select" on storage.objects;
create policy "files_tenant_select"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
  );

drop policy if exists "files_tenant_insert" on storage.objects;
create policy "files_tenant_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
  );

-- ------------------------------------------------------------
-- updated_at trigger for projects/profiles/subscriptions
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();
