create table if not exists public.shipping_regions (
  code text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.shipping_rates (
  commune_code text primary key,
  region_code text not null references public.shipping_regions(code) on delete cascade,
  commune_name text not null,
  price numeric(12,2) not null check (price >= 0),
  estimated_days_min integer not null check (estimated_days_min > 0),
  estimated_days_max integer not null check (estimated_days_max >= estimated_days_min),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists shipping_rates_region_idx on public.shipping_rates(region_code, commune_name);

alter table public.shipping_regions enable row level security;
alter table public.shipping_rates enable row level security;

create policy "Public reads shipping regions" on public.shipping_regions for select using (true);
create policy "Admin manages shipping regions" on public.shipping_regions for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
create policy "Public reads active commune rates" on public.shipping_rates for select using (active or public.is_dmaestros_admin());
create policy "Admin manages commune rates" on public.shipping_rates for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());

alter table public.orders add column if not exists shipping_region text not null default '';
alter table public.orders add column if not exists shipping_commune text not null default '';
alter table public.orders add column if not exists shipping_rate_code text;
alter table public.orders add column if not exists shipping_cost numeric(12,2) not null default 0;

