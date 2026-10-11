alter table public.footer_links add column if not exists category_id uuid references public.categories(id) on delete cascade;

-- Resolve legacy aliases against the category they actually link to.
with matches as (
  select distinct on (l.id) l.id, c.id category_id, c.name,
    row_number() over (partition by c.id order by l.sort_order,l.id) position
  from public.footer_links l join public.categories c
    on l.label=c.name or l.href='/tienda?categoria=' || replace(c.name,' ','%20')
  where l.section_key='collections'
  order by l.id, (l.label=c.name) desc
)
update public.footer_links l set category_id=case when m.position=1 then m.category_id else null end,
  label=m.name, active=l.active and m.position=1
from matches m where l.id=m.id;
update public.footer_links set active=false where section_key='collections' and category_id is null;

create or replace function public.admin_save_footer_collections(category_ids uuid[], section_title text, section_order integer, section_active boolean)
returns setof public.footer_links
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_dmaestros_admin() then raise exception 'Acceso denegado'; end if;
  perform pg_advisory_xact_lock(20261011,1900);
  if category_ids is null or cardinality(category_ids)>6
    or cardinality(category_ids)<>(select count(distinct id) from unnest(category_ids) id)
    or exists(select 1 from unnest(category_ids) chosen(category_id) where not exists(select 1 from public.categories c where c.id=chosen.category_id and c.active))
  then raise exception 'Selecciona hasta 6 categorías visibles, sin repetir.'; end if;
  update public.footer_sections set title=section_title,sort_order=section_order,active=section_active where section_key='collections';
  delete from public.footer_links where section_key='collections';
  return query insert into public.footer_links(section_key,label,href,category_id,sort_order,active)
    select 'collections',c.name,'/tienda?categoria=' || replace(c.name,' ','%20'),c.id,(s.position*10)::integer,true
    from unnest(category_ids) with ordinality s(id,position) join public.categories c on c.id=s.id
    order by s.position returning *;
end;
$$;
revoke all on function public.admin_save_footer_collections(uuid[],text,integer,boolean) from public;
grant execute on function public.admin_save_footer_collections(uuid[],text,integer,boolean) to authenticated;
