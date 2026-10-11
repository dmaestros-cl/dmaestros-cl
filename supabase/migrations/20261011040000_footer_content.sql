create table if not exists public.footer_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'DMaestros Chile',
  location_text text not null default 'Taller de productos artesanales fabricados en Chile',
  contact_email text not null default 'contacto@dmaestros.cl',
  service_text text not null default 'Atención personalizada',
  service_hours text not null default 'Lunes a viernes',
  updated_at timestamptz not null default now()
);

create table if not exists public.footer_sections (
  section_key text primary key,
  title text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  section_key text not null references public.footer_sections(section_key) on delete cascade,
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

alter table public.footer_settings enable row level security;
alter table public.footer_sections enable row level security;
alter table public.footer_links enable row level security;
create policy "Public reads footer settings" on public.footer_settings for select using (true);
create policy "Admin manages footer settings" on public.footer_settings for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
create policy "Public reads active footer sections" on public.footer_sections for select using (active or public.is_dmaestros_admin());
create policy "Admin manages footer sections" on public.footer_sections for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
create policy "Public reads active footer links" on public.footer_links for select using (active or public.is_dmaestros_admin());
create policy "Admin manages footer links" on public.footer_links for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());

insert into public.footer_settings (id) values (true) on conflict (id) do nothing;
insert into public.footer_sections (section_key,title,sort_order) values ('collections','Colecciones',10),('about','Quiénes somos',20),('information','Información',30) on conflict (section_key) do nothing;
insert into public.footer_links (section_key,label,href,sort_order)
select seed.section_key,seed.label,seed.href,seed.sort_order from (values
 ('collections','Destapadores de cerveza','/tienda?categoria=Juegos%20de%20cerveza',10),('collections','Cajas para tapas','/tienda?categoria=Cajas%20mixtas',20),('collections','Cajas para corchos','/tienda?categoria=Cajas%20para%20corchos',30),('collections','Juegos de cerveza','/tienda?categoria=Juegos%20de%20cerveza',40),('collections','Coffee Bar','/tienda?categoria=Coffee%20Bar',50),('collections','Pedidos especiales','mailto:contacto@dmaestros.cl?subject=Pedido%20especial',60),
 ('about','Conoce DMaestros','/#inicio',10),('about','Nuestro oficio','/#muebles',20),('about','Productos','/tienda',30),('about','Cotizaciones','mailto:contacto@dmaestros.cl?subject=Cotización',40),('about','Contacto','mailto:contacto@dmaestros.cl',50),
 ('information','Formas de pago','mailto:contacto@dmaestros.cl?subject=Formas%20de%20pago',10),('information','Despachos','mailto:contacto@dmaestros.cl?subject=Despachos',20),('information','Cambios y devoluciones','mailto:contacto@dmaestros.cl?subject=Cambios%20y%20devoluciones',30),('information','Garantía','mailto:contacto@dmaestros.cl?subject=Garantía',40),('information','Todos los productos','/tienda',50),('information','Personalizaciones','mailto:contacto@dmaestros.cl?subject=Personalización',60)
) as seed(section_key,label,href,sort_order)
where not exists (select 1 from public.footer_links);
