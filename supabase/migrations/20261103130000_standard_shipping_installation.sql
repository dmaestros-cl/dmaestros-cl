begin;

-- Installation is an explicit choice; an incomplete package is ordinary delivery
-- at the commune's existing standard price. Do not infer a mode from the category.
alter table public.products add column installation_required boolean not null default false;
grant update (installation_required) on public.products to authenticated;
alter table public.shipping_rates add constraint standard_shipping_clp
 check (price = trunc(price) and price between 0 and 999999999);
grant update (price) on public.shipping_rates to authenticated;

create or replace function public.blue_product_shipping_price(p_product_id uuid, p_commune_code text)
returns bigint language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 p public.products;
 destination public.shipping_rates;
 origin public.shipping_rates;
 tariff public.blue_pyme_tariffs;
 route_code text;
 weight_value numeric;
 incomplete boolean;
begin
 select * into p from public.products where id=p_product_id for share;
 if not found then raise exception 'CHECKOUT:Producto no disponible.'; end if;
 if p.installation_required then raise exception 'CHECKOUT:Flete e instalación a coordinar. Contacta a DMaestros antes de pagar.'; end if;
 select * into destination from public.shipping_rates where commune_code=p_commune_code and active for share;
 if not found then raise exception 'CHECKOUT:Selecciona una comuna con despacho disponible.'; end if;
 incomplete := p.package_weight_kg is null or p.package_length_cm is null or p.package_width_cm is null or p.package_height_cm is null;
 weight_value := greatest(p.package_weight_kg,p.package_length_cm*p.package_width_cm*p.package_height_cm/4000);
 -- A complete parcel requires a valid carrier configuration, even for its exceptions.
 if not incomplete then
   select r.* into origin from public.shipping_settings s join public.shipping_rates r on r.commune_code=s.origin_commune_code where s.id=true for share of s,r;
   if not found then raise exception 'CHECKOUT:El origen del despacho aún no está configurado. Contacta a DMaestros.'; end if;
   if origin.blue_zone='pendiente' or destination.blue_zone='pendiente' then raise exception 'CHECKOUT:La zona de despacho de esta comuna requiere confirmación. Contacta a DMaestros.'; end if;
   route_code:=case when origin.region_code=destination.region_code and origin.blue_zone=destination.blue_zone then 'local'
     when origin.blue_zone='extremo' or destination.blue_zone='extremo' then 'extreme' else 'central' end;
   select * into tariff from public.blue_pyme_tariffs where region_code=route_code for share;
   if not found then raise exception 'CHECKOUT:No hay una tarifa configurada para este destino.'; end if;
 end if;
 if not destination.blue_enabled or greatest(p.package_length_cm,p.package_width_cm,p.package_height_cm)>70 or weight_value>20 then
   if p.shipping_fallback_mode='fixed' and p.shipping_fallback_price>0 then return p.shipping_fallback_price; end if;
   raise exception 'CHECKOUT:Flete por coordinar. Confirma el valor y las condiciones de entrega con DMaestros antes de pagar.';
 end if;
 if incomplete then
   if destination.price is null or destination.price <> trunc(destination.price) or destination.price not between 0 and 999999999 then raise exception 'CHECKOUT:Revisa la tarifa estándar de la comuna.'; end if;
   return destination.price::bigint;
 end if;
 return case when weight_value<=0.5 then coalesce(destination.blue_xs,tariff.xs)
   when weight_value<=3 then coalesce(destination.blue_s,tariff.s)
   when weight_value<=6 then coalesce(destination.blue_m,tariff.m)
   else coalesce(destination.blue_l,tariff.l) end;
end;
$$;
revoke all on function public.blue_product_shipping_price(uuid,text) from public,anon,authenticated;
grant execute on function public.blue_product_shipping_price(uuid,text) to service_role;

-- Installation requires coordination even if a mixed cart would otherwise qualify
-- for pickup or free shipping. Check only new attempts, under the product row lock.
create or replace function public.create_webpay_order(
  p_attempt_id uuid, p_request_hash text, p_client_hash text,
  p_customer jsonb, p_items jsonb, p_region_code text, p_commune_code text,
  p_expected_total bigint, p_environment text, p_commerce_code text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  existing public.webpay_transactions;
  product record;
  line jsonb;
  region_name text;
  rate public.shipping_rates;
  promotion public.shipping_settings;
  subtotal bigint := 0;
  unit_amount numeric;
  quantity_value integer;
  shipping_amount bigint := 0;
  product_shipping_amount bigint := 0;
  highest_shipping_amount bigint := 0;
  blue_amount bigint;
  blue_line record;
  total_units integer := 0;
  pickup boolean := false;
  order_uuid uuid;
  item_rows jsonb := '[]'::jsonb;
  seen_skus text[] := '{}';
  attempts_count integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_attempt_id::text, 0));
  select * into existing from public.webpay_transactions where id = p_attempt_id;
  if found then
    if existing.request_hash <> p_request_hash or existing.environment <> p_environment or existing.commerce_code <> p_commerce_code then
      raise exception 'CHECKOUT:Este intento pertenece a otra compra. Vuelve a revisar el carrito.';
    end if;
    return to_jsonb(existing) || jsonb_build_object('created', false);
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'CHECKOUT:El carrito no es válido.';
  end if;
  if length(trim(p_customer->>'name')) not between 2 and 150
    or length(trim(p_customer->>'email')) not between 3 and 254
    or length(trim(p_customer->>'phone')) not between 8 and 30 then
    raise exception 'CHECKOUT:Revisa los datos de contacto.';
  end if;
  select name into region_name from public.shipping_regions where code = p_region_code;
  if not found then raise exception 'CHECKOUT:Selecciona una región válida.'; end if;
  for line in select value from jsonb_array_elements(p_items) loop
    if (line->>'sku') = any(seen_skus) then raise exception 'CHECKOUT:Hay productos duplicados.'; end if;
    seen_skus := array_append(seen_skus, line->>'sku');
    if coalesce(line->>'quantity', '') !~ '^[1-9][0-9]?$' then raise exception 'CHECKOUT:Cantidad inválida.'; end if;
    quantity_value := (line->>'quantity')::integer;
    total_units := total_units + quantity_value;
    select p.*, coalesce(p.shipping_scope = 'rm', c.shipping_rm_only) as shipping_rm_only into product
      from public.products p join public.categories c on c.id = p.category_id
      where p.sku = line->>'sku' and p.active and p.available and c.active and p.sale_mode = 'buy'
      for share of p, c;
    if not found then raise exception 'CHECKOUT:Un producto ya no está disponible para compra. Revisa el carrito.'; end if;
    if product.installation_required then raise exception 'CHECKOUT:Flete e instalación a coordinar. Contacta a DMaestros antes de pagar.'; end if;
    if product.stock > 0 and quantity_value > product.stock then raise exception 'CHECKOUT:La cantidad supera el stock disponible.'; end if;
    unit_amount := coalesce(product.sale_price, product.price);
    if unit_amount is null or unit_amount <= 0 or unit_amount <> trunc(unit_amount) then raise exception 'CHECKOUT:El precio de un producto requiere revisión.'; end if;
    subtotal := subtotal + unit_amount::bigint * quantity_value;
    pickup := pickup or (product.shipping_rm_only and p_region_code <> 'CL-RM');
    item_rows := item_rows || jsonb_build_array(jsonb_build_object(
      'product_id', product.id, 'sku', product.sku, 'product_name', product.name,
      'unit_price', unit_amount, 'quantity', quantity_value
    ));
  end loop;
  if not pickup then
    select * into rate from public.shipping_rates where commune_code = p_commune_code and region_code = p_region_code and active for share;
    if not found then raise exception 'CHECKOUT:Selecciona una comuna con despacho disponible.'; end if;
    for blue_line in
      select p.id,x.quantity from jsonb_to_recordset(item_rows) as x(product_id uuid,quantity integer)
      join public.products p on p.id=x.product_id
    loop
      blue_amount := public.blue_product_shipping_price(blue_line.id,p_commune_code);
      product_shipping_amount := product_shipping_amount + blue_amount * blue_line.quantity;
      highest_shipping_amount := greatest(highest_shipping_amount,blue_amount);
    end loop;
    shipping_amount := product_shipping_amount;
    select * into promotion from public.shipping_settings where id = true for share;
    if not found then raise exception 'CHECKOUT:La configuración de envío no está disponible. Intenta nuevamente más tarde.'; end if;
    if promotion.calculation_mode = 'highest' then
      shipping_amount := highest_shipping_amount;
    end if;
    if promotion.quantity_discount_enabled and total_units >= promotion.quantity_discount_min_units then
      shipping_amount := round(shipping_amount::numeric * (100 - promotion.quantity_discount_percent) / 100)::bigint;
    end if;
    if promotion.mode = 'all' or (promotion.mode = 'threshold' and subtotal >= promotion.minimum_subtotal) then
      shipping_amount := 0;
    end if;
    if length(trim(coalesce(p_customer->>'address', ''))) not between 5 and 500 then raise exception 'CHECKOUT:Ingresa la dirección de despacho.'; end if;
  end if;
  if subtotal + shipping_amount <> p_expected_total then raise exception 'CHECKOUT:El precio o despacho cambió. Actualiza el carrito antes de pagar.'; end if;
  if subtotal + shipping_amount not between 1 and 999999999 then raise exception 'CHECKOUT:El total excede el límite de compra en línea.'; end if;

  insert into public.webpay_rate_limits (client_hash) values (p_client_hash)
  on conflict (client_hash) do update set
    attempts = case when webpay_rate_limits.window_start < now() - interval '1 hour' then 1 else webpay_rate_limits.attempts + 1 end,
    window_start = case when webpay_rate_limits.window_start < now() - interval '1 hour' then now() else webpay_rate_limits.window_start end
  returning attempts into attempts_count;
  if attempts_count > 20 then raise exception 'CHECKOUT:Demasiados intentos de compra. Espera antes de volver a intentar.'; end if;

  insert into public.orders (customer_name, customer_email, customer_phone, shipping_address,
    shipping_region, shipping_commune, shipping_rate_code, shipping_cost, total, payment_provider, payment_status, payment_environment)
  values (trim(p_customer->>'name'), lower(trim(p_customer->>'email')), trim(p_customer->>'phone'), coalesce(p_customer->>'address', ''),
    region_name, case when pickup then 'Retiro en taller' else rate.commune_name end,
    case when pickup then null else rate.commune_code end, shipping_amount, subtotal + shipping_amount, 'webpay_plus', 'pending', p_environment)
  returning id into order_uuid;
  insert into public.order_items (order_id, product_id, sku, product_name, unit_price, quantity)
  select order_uuid, x.product_id, x.sku, x.product_name, x.unit_price, x.quantity
  from jsonb_to_recordset(item_rows) as x(product_id uuid, sku text, product_name text, unit_price numeric, quantity integer);
  insert into public.webpay_transactions (id, order_id, request_hash, buy_order, session_id, amount, environment, commerce_code)
  values (p_attempt_id, order_uuid, p_request_hash, 'DM-' || substr(replace(p_attempt_id::text, '-', ''), 1, 23),
    p_attempt_id::text, subtotal + shipping_amount, p_environment, p_commerce_code)
  returning * into existing;
  return to_jsonb(existing) || jsonb_build_object('created', true);
end;
$$;
revoke all on function public.create_webpay_order(uuid,text,text,jsonb,jsonb,text,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.create_webpay_order(uuid,text,text,jsonb,jsonb,text,text,bigint,text,text) to service_role;

notify pgrst,'reload schema';
commit;
