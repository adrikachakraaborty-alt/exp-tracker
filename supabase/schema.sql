-- Run this entire file once in Supabase Dashboard → SQL Editor.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  transaction_date date not null default current_date,
  description text not null check (char_length(description) <= 160),
  category text not null default 'Other' check (char_length(category) <= 60),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Read own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Create own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Update own transactions" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own transactions" on public.transactions for delete using (auth.uid() = user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
