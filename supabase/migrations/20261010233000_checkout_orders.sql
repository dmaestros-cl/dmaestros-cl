alter table public.orders add column if not exists customer_phone text not null default '';
alter table public.orders add column if not exists shipping_address text not null default '';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create policy "Customers create orders" on public.orders for insert with check (status = 'pendiente' and shipping_status = 'por_preparar');
create policy "Customers create order items" on public.order_items for insert with check (true);
create policy "Admin manages order items" on public.order_items for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
