alter table public.products
add column if not exists sale_mode text not null default 'quote'
check (sale_mode in ('buy', 'quote'));

update public.products set sale_mode = case when price is null then 'quote' else 'buy' end;

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  whatsapp_number text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;
create policy "Public reads store settings" on public.store_settings for select using (true);
create policy "Admin manages store settings" on public.store_settings for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
insert into public.store_settings (id, whatsapp_number) values (true, '') on conflict (id) do nothing;
