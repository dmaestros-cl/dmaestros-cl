alter table public.store_settings add column if not exists tiktok_url text not null default '';
alter table public.store_settings add column if not exists tiktok_active boolean not null default true;
