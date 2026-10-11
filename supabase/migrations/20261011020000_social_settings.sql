alter table public.store_settings add column if not exists instagram_url text not null default '';
alter table public.store_settings add column if not exists instagram_active boolean not null default true;
alter table public.store_settings add column if not exists facebook_url text not null default '';
alter table public.store_settings add column if not exists facebook_active boolean not null default true;
alter table public.store_settings add column if not exists youtube_url text not null default '';
alter table public.store_settings add column if not exists youtube_active boolean not null default true;
