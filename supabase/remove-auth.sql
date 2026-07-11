-- One-time conversion for an EXISTING database that was created with the old
-- schema (the one with user_id and per-user policies). Run this whole file
-- once in Supabase Dashboard → SQL Editor. Existing transactions are kept.
drop policy if exists "Read own transactions" on public.transactions;
drop policy if exists "Create own transactions" on public.transactions;
drop policy if exists "Update own transactions" on public.transactions;
drop policy if exists "Delete own transactions" on public.transactions;
alter table public.transactions drop column if exists user_id;
create policy "Anyone can read" on public.transactions for select using (true);
create policy "Anyone can create" on public.transactions for insert with check (true);
create policy "Anyone can update" on public.transactions for update using (true) with check (true);
create policy "Anyone can delete" on public.transactions for delete using (true);
create index if not exists transactions_date_idx on public.transactions(transaction_date desc);
