-- Authorized database smoke test. All changes are rolled back, including fixtures.
-- Explicit negative order number avoids advancing the real order-number sequence.
begin;
do $$
declare
  fixture_id uuid := gen_random_uuid();
  administrator uuid;
begin
  select id into administrator from auth.users
  where lower(email)='dmaestros.cl@gmail.com' and raw_app_meta_data->>'role'='admin';
  if administrator is null then raise exception 'Missing administrator'; end if;
  perform set_config('test.order_id',fixture_id::text,true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
  insert into public.orders (id,order_number,customer_name,customer_email,customer_phone,shipping_address,shipping_region,shipping_commune,shipping_cost,total,payment_provider,payment_environment,payment_status,status)
  values (fixture_id,-1300001,'Prueba técnica temporal','order-actions@example.com','+56912345678','Dirección ficticia 123','Metropolitana','Santiago',250,1250,'webpay_plus','integration','authorized','pagado');
  insert into public.order_items (order_id,sku,product_name,unit_price,quantity)
  values (fixture_id,'ADMIN-ACTIONS-SMOKE','Prueba temporal',1000,1);
  insert into public.webpay_transactions (id,order_id,request_hash,buy_order,session_id,amount,environment,commerce_code,state)
  values (gen_random_uuid(),fixture_id,'smoke-test','SMOKE-'||substr(fixture_id::text,1,18),fixture_id::text,1250,'integration','597055555532','authorized');
  perform set_config('request.jwt.claim.sub',administrator::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',administrator,'role','authenticated')::text,true);
end;
$$;

set local role authenticated;
do $$
declare
  result jsonb;
  fixture_id uuid := current_setting('test.order_id')::uuid;
begin
  result := public.admin_update_order_details(fixture_id,0,jsonb_build_object(
    'customer_name','Prueba técnica editada','customer_email','updated-order@example.com',
    'customer_phone','+56952024079','shipping_address','Otra dirección ficticia 456',
    'shipping_region','Metropolitana','shipping_commune','Providencia'));
  if result->>'customer_name' <> 'Prueba técnica editada' or result->>'details_version' <> '1'
    or (result->>'total')::numeric <> 1250 or (result->>'shipping_cost')::numeric <> 250
    or result->>'payment_status' <> 'authorized' then raise exception 'Edit verification failed'; end if;
  result := public.admin_delete_order(fixture_id,-1300001);
  if result->>'deleted' <> 'true' then raise exception 'Delete verification failed'; end if;
end;
$$;

reset role;
do $$
declare fixture_id uuid := current_setting('test.order_id')::uuid;
begin
  if exists(select 1 from public.orders where id=fixture_id)
    or exists(select 1 from public.order_items where order_id=fixture_id)
    or exists(select 1 from public.webpay_transactions where order_id=fixture_id)
    then raise exception 'Orphan records remain'; end if;
end;
$$;
rollback;
select 'PASS: admin edit and deletion; fixture rolled back; existing orders untouched' as result;
