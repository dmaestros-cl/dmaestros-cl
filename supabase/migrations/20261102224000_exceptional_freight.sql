begin;

alter table public.products
 add column shipping_fallback_mode text not null default 'coordinate' check (shipping_fallback_mode in ('coordinate','fixed')),
 add column shipping_fallback_price integer,
 add constraint valid_special_freight check (
   (shipping_fallback_mode='coordinate' and shipping_fallback_price is null)
   or (shipping_fallback_mode='fixed' and shipping_fallback_price is not null and shipping_fallback_price between 1 and 999999999)
 );
grant update (shipping_fallback_mode,shipping_fallback_price) on public.products to authenticated;

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
 weight_value:=greatest(p.package_weight_kg,p.package_length_cm*p.package_width_cm*p.package_height_cm/4000);
 select * into destination from public.shipping_rates where commune_code=p_commune_code and active for share;
 if not found then raise exception 'CHECKOUT:Selecciona una comuna con despacho disponible.'; end if;
 select r.* into origin from public.shipping_settings s join public.shipping_rates r on r.commune_code=s.origin_commune_code where s.id=true for share of s,r;
 if not found then raise exception 'CHECKOUT:El origen del despacho aún no está configurado. Contacta a DMaestros.'; end if;
 if origin.blue_zone='pendiente' or destination.blue_zone='pendiente' then raise exception 'CHECKOUT:La zona de despacho de esta comuna requiere confirmación. Contacta a DMaestros.'; end if;
 route_code:=case when origin.region_code=destination.region_code and origin.blue_zone=destination.blue_zone then 'local'
   when origin.blue_zone='extremo' or destination.blue_zone='extremo' then 'extreme' else 'central' end;
 select * into tariff from public.blue_pyme_tariffs where region_code=route_code for share;
 if not found then raise exception 'CHECKOUT:No hay una tarifa configurada para este destino.'; end if;
 -- Fixed freight is only eligible for unavailable carrier coverage, never for
 -- incomplete measurements, invalid configuration, or a normal automatic quote.
 if not destination.blue_enabled or greatest(p.package_length_cm,p.package_width_cm,p.package_height_cm)>70 or weight_value>20 then
   if p.shipping_fallback_mode='fixed' and p.shipping_fallback_price>0 then return p.shipping_fallback_price; end if;
   raise exception 'CHECKOUT:Flete por coordinar. Confirma el valor y las condiciones de entrega con DMaestros antes de pagar.';
 end if;
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
