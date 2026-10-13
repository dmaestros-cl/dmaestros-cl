begin;

alter table public.orders add column details_version bigint not null default 0;

-- Version contact/delivery changes, including updates outside the editor.
create function public.version_order_details() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.customer_name,new.customer_email,new.customer_phone,new.shipping_address,new.shipping_region,new.shipping_commune)
    is distinct from row(old.customer_name,old.customer_email,old.customer_phone,old.shipping_address,old.shipping_region,old.shipping_commune) then
    new.details_version := old.details_version + 1;
  else
    new.details_version := old.details_version;
  end if;
  return new;
end;
$$;
create trigger version_order_details before update on public.orders
for each row execute function public.version_order_details();

create function public.admin_update_order_details(p_order_id uuid, p_expected_version bigint, p_details jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.orders;
  field text;
  allowed_fields text[] := array['customer_name','customer_email','customer_phone','shipping_address','shipping_region','shipping_commune'];
begin
  if not coalesce(public.is_dmaestros_admin(),false) then
    raise exception 'ORDER:Solo un administrador puede editar pedidos.' using errcode = '42501';
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' then raise exception 'ORDER:Datos de pedido inválidos.'; end if;
  if exists(select 1 from jsonb_object_keys(p_details) as k where not k = any(allowed_fields)) then
    raise exception 'ORDER:Solo puedes editar los datos de contacto y envío.';
  end if;
  foreach field in array allowed_fields loop
    if jsonb_typeof(p_details->field) is distinct from 'string' then raise exception 'ORDER:Revisa los datos de contacto y envío.'; end if;
  end loop;
  if length(trim(p_details->>'customer_name')) not between 2 and 150 then raise exception 'ORDER:Ingresa el nombre del cliente (2 a 150 caracteres).'; end if;
  if length(trim(p_details->>'customer_email')) not between 3 and 254 or trim(p_details->>'customer_email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'ORDER:Ingresa un correo válido.';
  end if;
  if trim(p_details->>'customer_phone') <> '' and (length(trim(p_details->>'customer_phone')) not between 8 and 30 or trim(p_details->>'customer_phone') !~ '^\+?[0-9 ()-]+$') then
    raise exception 'ORDER:Revisa el teléfono del cliente.';
  end if;
  if length(p_details->>'shipping_address') > 500 or length(p_details->>'shipping_region') > 120 or length(p_details->>'shipping_commune') > 120 then
    raise exception 'ORDER:La dirección, región o comuna es demasiado larga.';
  end if;
  select * into target from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER:Este pedido ya no existe.'; end if;
  if p_expected_version is distinct from target.details_version then raise exception 'ORDER:El pedido cambió mientras lo editabas. Cierra el formulario y actualiza la página.'; end if;
  update public.orders set
    customer_name=trim(p_details->>'customer_name'), customer_email=lower(trim(p_details->>'customer_email')),
    customer_phone=trim(p_details->>'customer_phone'), shipping_address=trim(p_details->>'shipping_address'),
    shipping_region=trim(p_details->>'shipping_region'), shipping_commune=trim(p_details->>'shipping_commune'),
    shipping_rate_code=case when shipping_region is distinct from trim(p_details->>'shipping_region') or shipping_commune is distinct from trim(p_details->>'shipping_commune') then null else shipping_rate_code end
  where id=p_order_id returning * into target;
  -- Never change totals, payment state, account profiles or shipping charges here.
  return to_jsonb(target);
end;
$$;
revoke all on function public.admin_update_order_details(uuid,bigint,jsonb) from public, anon;
grant execute on function public.admin_update_order_details(uuid,bigint,jsonb) to authenticated;

create function public.admin_delete_order(p_order_id uuid, p_order_number bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.orders;
  payment public.webpay_transactions;
begin
  if not coalesce(public.is_dmaestros_admin(),false) then
    raise exception 'ORDER:Solo un administrador puede eliminar pedidos.' using errcode = '42501';
  end if;
  -- Same locking order as payment settlement: payment first, then order.
  select * into payment from public.webpay_transactions where order_id=p_order_id for update;
  select * into target from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER:Este pedido ya no existe.'; end if;
  if target.order_number is distinct from p_order_number then raise exception 'ORDER:El número de confirmación no coincide con el pedido.'; end if;
  if payment.processing_until > now() then raise exception 'ORDER:Webpay está verificando este pago. Espera y vuelve a intentarlo.'; end if;
  if (payment.environment='production' and payment.state in ('creating','initialized'))
    or (target.payment_provider='webpay_plus' and target.payment_environment='production' and coalesce(target.payment_status,'pending')='pending') then
    raise exception 'ORDER:Primero debes resolver el pago real pendiente en Webpay. No es seguro eliminarlo mientras puede recibir un cobro.';
  end if;
  delete from public.webpay_transactions where order_id=p_order_id;
  delete from public.order_items where order_id=p_order_id;
  delete from public.orders where id=p_order_id;
  -- Do not delete shared products, images, customer accounts or IP rate limits.
  return jsonb_build_object('id',target.id,'order_number',target.order_number,'deleted',true);
end;
$$;
revoke all on function public.admin_delete_order(uuid,bigint) from public, anon;
grant execute on function public.admin_delete_order(uuid,bigint) to authenticated;

commit;
