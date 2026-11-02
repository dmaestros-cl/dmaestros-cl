begin;

-- Existing products retain their configured fees until their real package is entered.
alter table public.products
  add column shipping_automatic boolean not null default false,
  add column package_weight_kg numeric(8,3) check (package_weight_kg > 0 and package_weight_kg <= 1000),
  add column package_length_cm numeric(8,1) check (package_length_cm > 0 and package_length_cm <= 1000),
  add column package_width_cm numeric(8,1) check (package_width_cm > 0 and package_width_cm <= 1000),
  add column package_height_cm numeric(8,1) check (package_height_cm > 0 and package_height_cm <= 1000),
  add constraint automatic_shipping_requires_package check (not shipping_automatic or (package_weight_kg is not null and package_length_cm is not null and package_width_cm is not null and package_height_cm is not null));

alter table public.shipping_settings add column origin_commune_code text references public.shipping_rates(commune_code);
grant update (origin_commune_code) on public.shipping_settings to authenticated;

-- Official ecommerce ground/Express tariff, delivery to the recipient's address,
-- VAT included. Source consulted 2026-11-02:
-- https://cdn.blue.cl/clientes/1bluex/tarifa-segmento-shopify-api.pdf
create table public.blue_shipping_tariffs (
  region_code text primary key,
  xs integer not null check (xs between 0 and 999999999),
  s integer not null check (s between 0 and 999999999),
  m integer not null check (m between 0 and 999999999),
  l integer not null check (l between 0 and 999999999),
  xl integer not null check (xl between 0 and 999999999),
  extra_kg integer not null default 320 check (extra_kg between 0 and 999999999),
  updated_at timestamptz not null default now()
);
alter table public.blue_shipping_tariffs enable row level security;
grant select on public.blue_shipping_tariffs to anon, authenticated;
grant update (xs,s,m,l,xl,extra_kg,updated_at) on public.blue_shipping_tariffs to authenticated;
grant all on public.blue_shipping_tariffs to service_role;
create policy "Public reads Blue tariff" on public.blue_shipping_tariffs for select using (true);
create policy "Administrators update Blue tariff" on public.blue_shipping_tariffs for update to authenticated using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
insert into public.blue_shipping_tariffs (region_code,xs,s,m,l,xl) values
 ('same_region',3100,3650,4700,5700,7600),
 ('CL-AP',7150,8300,12400,17000,25000),
 ('CL-TA',6550,7400,10700,15500,23000),
 ('CL-AN',6300,7000,9900,14000,21000),
 ('CL-AT',4850,5900,7700,9900,13800),
 ('CL-CO',4600,5600,7000,9600,12800),
 ('CL-VS',3900,4500,6000,7700,9700),
 ('CL-RM',3100,3650,4700,5700,7600),
 ('CL-LI',4000,4800,6400,8300,11300),
 ('CL-ML',4200,5200,6700,8900,12100),
 ('CL-NB',4600,5400,7200,9200,12600),
 ('CL-BI',4700,5700,7300,9500,12800),
 ('CL-AR',4950,5900,7700,9900,13800),
 ('CL-LR',5300,6100,8300,10000,14200),
 ('CL-LL',5300,6200,8300,10000,14200),
 ('CL-AI',8000,9500,14000,21500,28500),
 ('CL-MA',8000,9500,14000,21500,28500);

alter table public.shipping_rates
 add column blue_enabled boolean not null default true,
 add column blue_xs integer check (blue_xs between 0 and 999999999),
 add column blue_s integer check (blue_s between 0 and 999999999),
 add column blue_m integer check (blue_m between 0 and 999999999),
 add column blue_l integer check (blue_l between 0 and 999999999),
 add column blue_xl integer check (blue_xl between 0 and 999999999),
 add column blue_extra_kg integer check (blue_extra_kg between 0 and 999999999);
grant update (blue_enabled,blue_xs,blue_s,blue_m,blue_l,blue_xl,blue_extra_kg) on public.shipping_rates to authenticated;
-- Do not extrapolate a mainland ground tariff to oceanic islands or Antarctica.
update public.shipping_rates set blue_enabled=false where commune_code in ('vs0104','vs0201','ma0202');

create function public.blue_product_shipping_price(p_product_id uuid, p_commune_code text)
returns bigint language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 p public.products;
 destination public.shipping_rates;
 tariff public.blue_shipping_tariffs;
 origin_region text;
 weight_value numeric;
 base bigint;
begin
 select * into p from public.products where id=p_product_id for share;
 if not found or p.package_weight_kg is null or p.package_length_cm is null or p.package_width_cm is null or p.package_height_cm is null then
   raise exception 'CHECKOUT:Faltan el peso o las medidas del embalaje de un producto. Contacta a DMaestros.';
 end if;
 if greatest(p.package_length_cm,p.package_width_cm,p.package_height_cm)>70 then
   raise exception 'CHECKOUT:Un producto supera los 70 cm por lado de este servicio. Contacta a DMaestros para coordinar el despacho.';
 end if;
 select * into destination from public.shipping_rates where commune_code=p_commune_code and active for share;
 if not found or not destination.blue_enabled then raise exception 'CHECKOUT:Este destino requiere coordinar el despacho con DMaestros.'; end if;
 select r.region_code into origin_region from public.shipping_settings s join public.shipping_rates r on r.commune_code=s.origin_commune_code where s.id=true for share of s,r;
 if not found then raise exception 'CHECKOUT:El origen del despacho aún no está configurado. Contacta a DMaestros.'; end if;
 select * into tariff from public.blue_shipping_tariffs where region_code=case when origin_region=destination.region_code then 'same_region' else destination.region_code end for share;
 if not found then raise exception 'CHECKOUT:No hay una tarifa configurada para este destino.'; end if;
 weight_value:=greatest(p.package_weight_kg,p.package_length_cm*p.package_width_cm*p.package_height_cm/4000);
 base:=case when weight_value<=0.5 then coalesce(destination.blue_xs,tariff.xs)
   when weight_value<=3 then coalesce(destination.blue_s,tariff.s)
   when weight_value<=6 then coalesce(destination.blue_m,tariff.m)
   when weight_value<=16 then coalesce(destination.blue_l,tariff.l)
   else coalesce(destination.blue_xl,tariff.xl) end;
 return base+greatest(0,ceil(weight_value-25))::bigint*coalesce(destination.blue_extra_kg,tariff.extra_kg);
end;
$$;
revoke all on function public.blue_product_shipping_price(uuid,text) from public,anon,authenticated;
grant execute on function public.blue_product_shipping_price(uuid,text) to service_role;

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
  uses_commune_rate boolean := false;
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
    if product.stock > 0 and quantity_value > product.stock then raise exception 'CHECKOUT:La cantidad supera el stock disponible.'; end if;
    unit_amount := coalesce(product.sale_price, product.price);
    if unit_amount is null or unit_amount <= 0 or unit_amount <> trunc(unit_amount) then raise exception 'CHECKOUT:El precio de un producto requiere revisión.'; end if;
    subtotal := subtotal + unit_amount::bigint * quantity_value;
    if product.shipping_automatic then
      null; -- Calculated below, after the complete cart determines pickup.
    elsif product.shipping_price is null then
      uses_commune_rate := true;
    else
      product_shipping_amount := product_shipping_amount + product.shipping_price::bigint * quantity_value;
      highest_shipping_amount := greatest(highest_shipping_amount, product.shipping_price::bigint);
    end if;
    pickup := pickup or (product.shipping_rm_only and p_region_code <> 'CL-RM');
    item_rows := item_rows || jsonb_build_array(jsonb_build_object(
      'product_id', product.id, 'sku', product.sku, 'product_name', product.name,
      'unit_price', unit_amount, 'quantity', quantity_value
    ));
  end loop;
  if not pickup then
    select * into rate from public.shipping_rates where commune_code = p_commune_code and region_code = p_region_code and active for share;
    if not found then raise exception 'CHECKOUT:Selecciona una comuna con despacho disponible.'; end if;
    if rate.price <> trunc(rate.price) then raise exception 'CHECKOUT:La tarifa de despacho requiere revisión.'; end if;
    for blue_line in
      select p.id,x.quantity from jsonb_to_recordset(item_rows) as x(product_id uuid,quantity integer)
      join public.products p on p.id=x.product_id where p.shipping_automatic
    loop
      blue_amount := public.blue_product_shipping_price(blue_line.id,p_commune_code);
      product_shipping_amount := product_shipping_amount + blue_amount * blue_line.quantity;
      highest_shipping_amount := greatest(highest_shipping_amount,blue_amount);
    end loop;
    shipping_amount := product_shipping_amount + case when uses_commune_rate then rate.price::bigint else 0 end;
    select * into promotion from public.shipping_settings where id = true for share;
    if not found then raise exception 'CHECKOUT:La configuración de envío no está disponible. Intenta nuevamente más tarde.'; end if;
    if promotion.calculation_mode = 'highest' then
      shipping_amount := greatest(highest_shipping_amount, case when uses_commune_rate then rate.price::bigint else 0 end);
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



notify pgrst, 'reload schema';
commit;
