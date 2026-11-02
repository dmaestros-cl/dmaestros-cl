begin;

-- User confirmed Santiago origin and the Emprendedores platform (not ecommerce).
-- Public tariff: https://www.blue.cl/docs/enviar/tarifario-pyme.pdf, 2026-11-02.
-- Keep the unused ecommerce table as history; only this table is used by checkout.
create table public.blue_pyme_tariffs (
 region_code text primary key check (region_code in ('local','central','extreme')),
 xs integer not null check (xs between 0 and 999999999),
 s integer not null check (s between 0 and 999999999),
 m integer not null check (m between 0 and 999999999),
 l integer not null check (l between 0 and 999999999),
 updated_at timestamptz not null default now()
);
alter table public.blue_pyme_tariffs enable row level security;
grant select on public.blue_pyme_tariffs to anon,authenticated;
grant update (xs,s,m,l,updated_at) on public.blue_pyme_tariffs to authenticated;
grant all on public.blue_pyme_tariffs to service_role;
create policy "Public reads Blue Pyme tariffs" on public.blue_pyme_tariffs for select using (true);
create policy "Administrators update Blue Pyme tariffs" on public.blue_pyme_tariffs for update to authenticated using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
insert into public.blue_pyme_tariffs(region_code,xs,s,m,l) values
 ('local',3100,4200,4800,5400),
 ('central',4300,5600,7300,9200),
 ('extreme',5200,9500,14500,17000);

alter table public.shipping_rates add column blue_zone text not null default 'pendiente' check (blue_zone in ('santiago','centro','extremo','pendiente'));
grant update (blue_zone) on public.shipping_rates to authenticated;
-- User accepts actual published prices as editable references, not exact carrier quotes.
-- Mainland zones: Blue's map. RM grouping reference (not an official Blue zone list):
-- https://www.puntooriente.cl/pages/tarifas-de-despacho (consulted 2026-11-02).
update public.shipping_rates set blue_zone=case
 when region_code in ('CL-AP','CL-TA','CL-AN','CL-AI','CL-MA') then 'extremo'
 when region_code='CL-RM' and commune_name in ('Curacaví','María Pinto','Melipilla','San Pedro','Alhué','El Monte') then 'centro'
 when region_code='CL-RM' then 'santiago'
 else 'centro' end;
update public.shipping_settings set origin_commune_code=(select commune_code from public.shipping_rates where region_code='CL-RM' and commune_name='Santiago' limit 1)
 where id=true and origin_commune_code is null;

create or replace function public.blue_product_shipping_price(p_product_id uuid, p_commune_code text)
returns bigint language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 p public.products;
 destination public.shipping_rates;
 origin public.shipping_rates;
 tariff public.blue_pyme_tariffs;
 route_code text;
 weight_value numeric;
begin
 select * into p from public.products where id=p_product_id for share;
 if not found or p.package_weight_kg is null or p.package_length_cm is null or p.package_width_cm is null or p.package_height_cm is null then
   raise exception 'CHECKOUT:Faltan el peso o las medidas del embalaje de un producto. Contacta a DMaestros.';
 end if;
 if greatest(p.package_length_cm,p.package_width_cm,p.package_height_cm)>70 then
   raise exception 'CHECKOUT:Un producto supera los 70 cm por lado de este servicio. Contacta a DMaestros para coordinar el despacho.';
 end if;
 weight_value:=greatest(p.package_weight_kg,p.package_length_cm*p.package_width_cm*p.package_height_cm/4000);
 if weight_value>20 then raise exception 'CHECKOUT:Un producto supera los 20 kg físicos o volumétricos de Blue Express Emprendedores. Contacta a DMaestros.'; end if;
 select * into destination from public.shipping_rates where commune_code=p_commune_code and active for share;
 if not found or not destination.blue_enabled then raise exception 'CHECKOUT:Este destino requiere coordinar el despacho con DMaestros.'; end if;
 select r.* into origin from public.shipping_settings s join public.shipping_rates r on r.commune_code=s.origin_commune_code where s.id=true for share of s,r;
 if not found then raise exception 'CHECKOUT:El origen del despacho aún no está configurado. Contacta a DMaestros.'; end if;
 if origin.blue_zone='pendiente' or destination.blue_zone='pendiente' then raise exception 'CHECKOUT:La zona de despacho de esta comuna requiere confirmación. Contacta a DMaestros.'; end if;
 route_code:=case when origin.region_code=destination.region_code and origin.blue_zone=destination.blue_zone then 'local'
   when origin.blue_zone='extremo' or destination.blue_zone='extremo' then 'extreme' else 'central' end;
 select * into tariff from public.blue_pyme_tariffs where region_code=route_code for share;
 if not found then raise exception 'CHECKOUT:No hay una tarifa configurada para este destino.'; end if;
 return case when weight_value<=0.5 then coalesce(destination.blue_xs,tariff.xs)
   when weight_value<=3 then coalesce(destination.blue_s,tariff.s)
   when weight_value<=6 then coalesce(destination.blue_m,tariff.m)
   else coalesce(destination.blue_l,tariff.l) end;
end;
$$;
revoke all on function public.blue_product_shipping_price(uuid,text) from public,anon,authenticated;
grant execute on function public.blue_product_shipping_price(uuid,text) to service_role;
notify pgrst,'reload schema';
commit;
