-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- Adds pocket-money tracking fields and converts old category names.
alter table public.transactions add column if not exists is_starting boolean not null default false;
alter table public.transactions add column if not exists alert_below numeric(12,2);
update public.transactions set category = case category
  when 'Food & dining' then 'food'
  when 'Transport' then 'transport'
  when 'Shopping' then 'misc'
  when 'Bills' then 'misc'
  when 'Health' then 'medical'
  when 'Entertainment' then 'entertainment'
  when 'Salary' then 'misc'
  when 'Freelance' then 'misc'
  when 'Other' then 'misc'
  else category end;
