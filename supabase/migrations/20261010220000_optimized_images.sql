create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  storage_path text not null,
  public_url text not null,
  kind text not null check (kind in ('hero-mobile','hero-desktop','product')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes bigint not null check (bytes > 0),
  format text not null default 'webp' check (format = 'webp'),
  alt text not null default '',
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

alter table public.media_assets enable row level security;
create policy "Public reads media metadata" on public.media_assets for select using (true);
create policy "Admin manages media metadata" on public.media_assets for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());

alter table public.hero_slides add column if not exists mobile_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.hero_slides add column if not exists desktop_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.products add column if not exists image_asset_id uuid references public.media_assets(id) on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('hero-images', 'hero-images', true, 5242880, array['image/webp']),
  ('product-images', 'product-images', true, 5242880, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public reads product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admin uploads product images" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_dmaestros_admin());
create policy "Admin updates product images" on storage.objects for update using (bucket_id = 'product-images' and public.is_dmaestros_admin()) with check (bucket_id = 'product-images' and public.is_dmaestros_admin());
create policy "Admin deletes product images" on storage.objects for delete using (bucket_id = 'product-images' and public.is_dmaestros_admin());
