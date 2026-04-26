-- Supabase schema for "Quotations & invoices" app
-- Apply in Supabase SQL Editor (or migrations) for your project.
-- This stores ALL app data in Postgres keyed by the authenticated user.

-- Extensions
create extension if not exists pgcrypto;

-- 1) Profile (single row per user)
create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  contractor_name text not null default '',
  business_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  show_tin boolean not null default false,
  tin text not null default '',
  updated_at timestamptz not null default now()
);

-- 2) Settings (single row per user)
create table if not exists public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  quote_prefix text not null default 'Q',
  next_quote_number integer not null default 1,
  invoice_prefix text not null default 'INV',
  next_invoice_number integer not null default 1,
  default_validity_days integer not null default 30,
  default_invoice_due_days integer not null default 30,
  default_terms text not null default '',
  default_scope text not null default '',
  updated_at timestamptz not null default now()
);

-- 3) Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null default '',
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  billing_address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients(user_id);

-- 4) Quotes (nested arrays stored as JSONB)
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  number text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  issue_date date not null,
  valid_until date not null,
  validity_days integer not null default 30,
  scope_lines jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  contract_total numeric not null default 0,
  withholding_enabled boolean not null default false,
  withholding_percent numeric not null default 0,
  terms_and_conditions text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_user_id_idx on public.quotes(user_id);
create index if not exists quotes_client_id_idx on public.quotes(client_id);

-- 5) Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  number text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  quote_id uuid null references public.quotes(id) on delete set null,
  linked_quote_no text null,
  issue_date date not null,
  due_date date not null,
  scope_lines jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  contract_total numeric not null default 0,
  withholding_enabled boolean not null default false,
  withholding_percent numeric not null default 0,
  terms_and_conditions text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_client_id_idx on public.invoices(client_id);

-- 6) Bank accounts
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  bank_preset_id text not null default '',
  custom_bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  notes text not null default ''
);
create index if not exists bank_accounts_user_id_idx on public.bank_accounts(user_id);

-- Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists app_profiles_set_updated_at on public.app_profiles;
create trigger app_profiles_set_updated_at
before update on public.app_profiles
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

-- Optional: safer number generation across devices.
-- Your frontend can call these RPCs via supabase.rpc(...) to get a unique next number.
create or replace function public.consume_next_quote_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pfx text;
  n integer;
begin
  insert into public.app_settings(user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  update public.app_settings
  set next_quote_number = next_quote_number + 1
  where user_id = auth.uid()
  returning quote_prefix, next_quote_number - 1 into pfx, n;

  return pfx || '-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.consume_next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pfx text;
  n integer;
begin
  insert into public.app_settings(user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  update public.app_settings
  set next_invoice_number = next_invoice_number + 1
  where user_id = auth.uid()
  returning invoice_prefix, next_invoice_number - 1 into pfx, n;

  return pfx || '-' || lpad(n::text, 4, '0');
end;
$$;

-- Row Level Security
alter table public.app_profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.bank_accounts enable row level security;

-- Profile policies
drop policy if exists "profile_select_own" on public.app_profiles;
create policy "profile_select_own" on public.app_profiles
for select using (user_id = auth.uid());
drop policy if exists "profile_insert_own" on public.app_profiles;
create policy "profile_insert_own" on public.app_profiles
for insert with check (user_id = auth.uid());
drop policy if exists "profile_update_own" on public.app_profiles;
create policy "profile_update_own" on public.app_profiles
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Settings policies
drop policy if exists "settings_select_own" on public.app_settings;
create policy "settings_select_own" on public.app_settings
for select using (user_id = auth.uid());
drop policy if exists "settings_insert_own" on public.app_settings;
create policy "settings_insert_own" on public.app_settings
for insert with check (user_id = auth.uid());
drop policy if exists "settings_update_own" on public.app_settings;
create policy "settings_update_own" on public.app_settings
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Clients policies
drop policy if exists "clients_crud_own" on public.clients;
create policy "clients_crud_own" on public.clients
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Quotes policies
drop policy if exists "quotes_crud_own" on public.quotes;
create policy "quotes_crud_own" on public.quotes
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Invoices policies
drop policy if exists "invoices_crud_own" on public.invoices;
create policy "invoices_crud_own" on public.invoices
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Bank accounts policies
drop policy if exists "bank_accounts_crud_own" on public.bank_accounts;
create policy "bank_accounts_crud_own" on public.bank_accounts
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

