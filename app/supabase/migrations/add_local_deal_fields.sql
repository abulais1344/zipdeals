-- Optional local-deals metadata for homepage curation
alter table if exists public.products
  add column if not exists deal_type text,
  add column if not exists valid_till text;

alter table if exists public.products
  drop constraint if exists products_deal_type_check;

alter table if exists public.products
  add constraint products_deal_type_check
  check (deal_type is null or deal_type in ('Limited Time', 'Today Only', 'Clearance'));
