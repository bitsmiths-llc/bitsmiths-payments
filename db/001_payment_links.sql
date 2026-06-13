-- Payment links schema for self-hosted Postgres (Coolify).
--
-- Run ONCE as a privileged role (the `create extension` line needs superuser).
-- Idempotent — safe to re-run. This replaces the old Supabase migration; there
-- is no RLS here because the table is backend-only and access is controlled by
-- the least-privilege `payments_app` role (see 002_app_role.sql), not by RLS.

create extension if not exists pgcrypto;

create table if not exists public.payment_links (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  customer_id       text not null,
  customer_name     text not null,
  customer_email    text,
  line_items        jsonb not null,
  currency          text not null default 'usd',
  status            text not null default 'active'
                      check (status in ('active', 'paid', 'revoked')),
  expires_at        timestamptz,
  stripe_session_id text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists payment_links_slug_idx on public.payment_links (slug);

comment on table public.payment_links is
  'Stripe checkout link definitions, referenced by short slug at /pay/<slug>. Backend-only.';

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payment_links_set_updated_at on public.payment_links;
create trigger payment_links_set_updated_at
  before update on public.payment_links
  for each row execute function public.set_updated_at();
