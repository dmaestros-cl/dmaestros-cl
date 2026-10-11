alter table public.footer_links add column if not exists slug text;
alter table public.footer_links add column if not exists page_content text;
create unique index if not exists footer_links_slug_unique on public.footer_links(slug) where slug is not null;

update public.footer_links
set slug = case label
  when 'Conoce DMaestros' then 'conoce-dmaestros'
  when 'Nuestro oficio' then 'nuestro-oficio'
  when 'Productos' then 'productos'
  when 'Cotizaciones' then 'cotizaciones'
  when 'Contacto' then 'contacto'
  when 'Formas de pago' then 'formas-de-pago'
  when 'Despachos' then 'despachos'
  when 'Cambios y devoluciones' then 'cambios-y-devoluciones'
  when 'Garantía' then 'garantia'
  when 'Todos los productos' then 'todos-los-productos'
  when 'Personalizaciones' then 'personalizaciones'
end,
href = case label
  when 'Conoce DMaestros' then '/informacion/conoce-dmaestros'
  when 'Nuestro oficio' then '/informacion/nuestro-oficio'
  when 'Productos' then '/informacion/productos'
  when 'Cotizaciones' then '/informacion/cotizaciones'
  when 'Contacto' then '/informacion/contacto'
  when 'Formas de pago' then '/informacion/formas-de-pago'
  when 'Despachos' then '/informacion/despachos'
  when 'Cambios y devoluciones' then '/informacion/cambios-y-devoluciones'
  when 'Garantía' then '/informacion/garantia'
  when 'Todos los productos' then '/informacion/todos-los-productos'
  when 'Personalizaciones' then '/informacion/personalizaciones'
  else href
end
where section_key <> 'collections';
