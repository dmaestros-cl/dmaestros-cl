create extension if not exists unaccent;
create sequence if not exists public.product_sku_sequence start with 1;

create or replace function public.next_product_sku()
returns text language sql volatile set search_path = public as $$
  select 'DM' || extract(year from now())::integer::text || lpad(nextval('public.product_sku_sequence')::text, 3, '0');
$$;

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists sale_price numeric(12,2);
update public.products set slug = lower(regexp_replace(unaccent(name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lower(sku) where slug is null;
alter table public.products alter column slug set not null;
create unique index if not exists products_slug_key on public.products(slug);
alter table public.products alter column sku set default public.next_product_sku();
alter table public.products drop constraint if exists products_sale_price_check;
alter table public.products add constraint products_sale_price_check check (sale_price is null or (sale_price >= 0 and price is not null and sale_price < price));

create or replace function public.products_fill_identifiers()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.sku is null or btrim(new.sku) = '' then new.sku := public.next_product_sku(); end if;
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := trim(both '-' from lower(regexp_replace(unaccent(new.name), '[^a-zA-Z0-9]+', '-', 'g')));
  end if;
  return new;
end;
$$;
drop trigger if exists products_fill_identifiers_trigger on public.products;
create trigger products_fill_identifiers_trigger before insert or update on public.products for each row execute function public.products_fill_identifiers();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  public_url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(product_id, asset_id)
);
create unique index if not exists product_images_one_primary on public.product_images(product_id) where is_primary;
alter table public.product_images enable row level security;
create policy "Public reads product images" on public.product_images for select using (exists (select 1 from public.products where products.id = product_images.product_id and products.active));
create policy "Admin manages product images" on public.product_images for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
