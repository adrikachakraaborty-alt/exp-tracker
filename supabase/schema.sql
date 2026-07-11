-- Run this entire file once in Supabase Dashboard → SQL Editor.
-- No accounts, no sign-in: anyone with the app URL can read and edit the sheet.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  description text not null check (char_length(description) <= 160),
  category text not null default 'Other' check (char_length(category) <= 60),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  note text check (char_length(note) <= 500),
  is_starting boolean not null default false,
  alert_below numeric(12,2),
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Anyone can read" on public.transactions for select using (true);
create policy "Anyone can create" on public.transactions for insert with check (true);
create policy "Anyone can update" on public.transactions for update using (true) with check (true);
create policy "Anyone can delete" on public.transactions for delete using (true);
create index if not exists transactions_date_idx on public.transactions(transaction_date desc);
