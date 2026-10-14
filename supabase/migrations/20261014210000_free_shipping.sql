begin;

-- Singleton promotion; keep every commune's base tariff intact.
create table public.shipping_settings (
  id boolean primary key default true check (id),
  mode text not null default 'disabled' check (mode in ('disabled', 'all', 'threshold')),
  minimum_subtotal bigint check (minimum_subtotal between 1 and 999999999),
  updated_at timestamptz not null default now(),
  check (mode <> 'threshold' or minimum_subtotal is not null)
);
insert into public.shipping_settings (id) values (true);
alter table public.shipping_settings enable row level security;
revoke all on public.shipping_settings from public, anon, authenticated;
grant select on public.shipping_settings to anon, authenticated;
grant update (mode, minimum_subtotal, updated_at) on public.shipping_settings to authenticated;
grant all on public.shipping_settings to service_role;
create policy "Public reads shipping promotion" on public.shipping_settings for select using (true);
create policy "Only administrators update shipping promotion" on public.shipping_settings
  for update to authenticated using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());

-- Preserve idempotency, product/coverage checks and server-authoritative totals.
-- Only new orders use the promotion: existing orders and payments never change.
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
    select p.*, c.shipping_rm_only into product
      from public.products p join public.categories c on c.id = p.category_id
      where p.sku = line->>'sku' and p.active and p.available and c.active and p.sale_mode = 'buy'
      for share of p, c;
    if not found then raise exception 'CHECKOUT:Un producto ya no está disponible para compra. Revisa el carrito.'; end if;
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
    if rate.price <> trunc(rate.price) then raise exception 'CHECKOUT:La tarifa de despacho requiere revisión.'; end if;
    shipping_amount := rate.price::bigint;
    select * into promotion from public.shipping_settings where id = true for share;
    if not found then raise exception 'CHECKOUT:La configuración de envío no está disponible. Intenta nuevamente más tarde.'; end if;
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

commit;
