-- Run this whole file once in your Supabase project's SQL Editor.
-- It creates the three tables Split & Settle needs and opens up
-- permissive access policies suitable for a class project (no login system).

create extension if not exists "pgcrypto";

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  paid_by uuid references members(id) on delete set null,
  description text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

-- Row Level Security: enabled, with open policies.
-- This app has no auth system — anyone with a group's code can read/write
-- that group's data, which is the intended behavior (like a shared link).
alter table groups enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;

create policy "public read groups" on groups for select using (true);
create policy "public insert groups" on groups for insert with check (true);

create policy "public read members" on members for select using (true);
create policy "public insert members" on members for insert with check (true);

create policy "public read expenses" on expenses for select using (true);
create policy "public insert expenses" on expenses for insert with check (true);
