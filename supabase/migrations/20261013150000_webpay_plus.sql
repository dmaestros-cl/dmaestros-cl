-- Apply before enabling the new checkout. All payment writes are server-only.
begin;

alter table public.orders add column if not exists payment_provider text not null default 'manual'
  check (payment_provider in ('manual', 'webpay_plus'));
alter table public.orders add column if not exists payment_status text
  check (payment_status in ('pending', 'authorized', 'failed', 'cancelled', 'expired'));
alter table public.orders add column if not exists payment_environment text
  check (payment_environment in ('integration', 'production'));

create table public.webpay_transactions (
  id uuid primary key,
  receipt_id uuid not null unique default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  request_hash text not null,
  buy_order text not null unique check (length(buy_order) <= 26),
  session_id text not null check (length(session_id) <= 61),
  amount bigint not null check (amount > 0 and amount <= 999999999),
  environment text not null check (environment in ('integration', 'production')),
  commerce_code text not null,
  token text unique,
  redirect_url text,
  state text not null default 'creating' check (state in ('creating', 'initialized', 'authorized', 'failed', 'cancelled', 'expired')),
  processing_until timestamptz,
  return_event text check (return_event in ('commit', 'cancel', 'timeout', 'error')),
  authorization_code text,
  payment_type_code text,
  installments_number integer,
  card_last_four text,
  transaction_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.webpay_transactions enable row level security;
revoke all on public.webpay_transactions from anon, authenticated;
grant all on public.webpay_transactions to service_role;

create table public.webpay_rate_limits (
  client_hash text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.webpay_rate_limits enable row level security;
revoke all on public.webpay_rate_limits from anon, authenticated;
grant all on public.webpay_rate_limits to service_role;

-- Retire browser-supplied totals and unrestricted order-line insertion.
drop policy if exists "Customers create orders" on public.orders;
drop policy if exists "Customers create order items" on public.order_items;

create function public.create_webpay_order(
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
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
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
    if length(trim(coalesce(p_customer->>'address', ''))) not between 5 and 500 then raise exception 'CHECKOUT:Ingresa la dirección de despacho.'; end if;
  end if;
  if subtotal + shipping_amount <> p_expected_total then raise exception 'CHECKOUT:El precio o despacho cambió. Actualiza el carrito antes de pagar.'; end if;
  if subtotal + shipping_amount not between 1 and 999999999 then raise exception 'CHECKOUT:El total excede el límite de compra en línea.'; end if;

  -- Persistent rate limit; no in-memory counters on serverless instances.
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

create function public.finish_webpay_payment(p_id uuid, p_result jsonb, p_event text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  payment public.webpay_transactions;
  next_state text;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  select * into payment from public.webpay_transactions where id = p_id for update;
  if not found then raise exception 'Unknown payment'; end if;
  if p_result->>'buy_order' is distinct from payment.buy_order
    or p_result->>'session_id' is distinct from payment.session_id
    or (p_result->>'amount')::numeric is distinct from payment.amount then raise exception 'Payment mismatch'; end if;
  if payment.state = 'authorized' then return payment.state; end if;
  if p_result->>'status' = 'AUTHORIZED' and p_result->'response_code' = '0'::jsonb then
    next_state := 'authorized';
  elsif p_result->>'status' in ('FAILED', 'REVERSED', 'NULLIFIED') then
    next_state := 'failed';
  elsif p_result->>'status' = 'INITIALIZED' and p_event in ('cancel', 'timeout') then
    next_state := case when p_event = 'cancel' then 'cancelled' else 'expired' end;
  else
    update public.webpay_transactions set processing_until = null where id = p_id;
    return payment.state;
  end if;
  update public.webpay_transactions set state = next_state, processing_until = null, updated_at = now(),
    authorization_code = p_result->>'authorization_code', payment_type_code = p_result->>'payment_type_code',
    installments_number = (p_result->>'installments_number')::integer,
    card_last_four = right(regexp_replace(coalesce(p_result->'card_detail'->>'card_number', ''), '\D', '', 'g'), 4),
    transaction_date = (p_result->>'transaction_date')::timestamptz
    where id = p_id;
  update public.orders set payment_status = next_state,
    status = case when next_state = 'authorized' then 'pagado' else 'cancelado' end
    where id = payment.order_id;
  return next_state;
end;
$$;
revoke all on function public.finish_webpay_payment(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.finish_webpay_payment(uuid,jsonb,text) to service_role;

-- Even administrators cannot mark a Webpay order paid without a verified server result.
create function public.protect_webpay_order() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    if new.payment_provider <> 'manual' or new.payment_status is not null or new.payment_environment is not null then raise exception 'Webpay is server-managed'; end if;
  elsif old.payment_provider = 'webpay_plus' then
    if new.payment_provider is distinct from old.payment_provider or new.payment_status is distinct from old.payment_status or new.payment_environment is distinct from old.payment_environment
      or new.total is distinct from old.total or new.shipping_cost is distinct from old.shipping_cost
      or (new.status in ('pagado','preparando','enviado','entregado') and old.payment_status <> 'authorized')
      or (old.payment_environment = 'integration' and new.shipping_status is distinct from old.shipping_status) then
      raise exception 'El pago Webpay solo puede confirmarse desde Transbank.';
    end if;
  elsif new.payment_provider is distinct from old.payment_provider or new.payment_status is distinct from old.payment_status or new.payment_environment is distinct from old.payment_environment then
    raise exception 'Webpay is server-managed';
  end if;
  return new;
end;
$$;
create trigger protect_webpay_order before insert or update on public.orders for each row execute function public.protect_webpay_order();

commit;
