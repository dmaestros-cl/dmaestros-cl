alter table public.categories add column if not exists shipping_rm_only boolean not null default false;
