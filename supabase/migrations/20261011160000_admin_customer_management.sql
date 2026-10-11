create policy "Admin manages customer profiles" on public.customer_profiles
for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());

create or replace function public.admin_delete_customer(customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_dmaestros_admin() then
    raise exception 'Acceso denegado';
  end if;
  if customer_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta administrativa';
  end if;
  delete from auth.users where id = customer_id;
end;
$$;

revoke all on function public.admin_delete_customer(uuid) from public;
grant execute on function public.admin_delete_customer(uuid) to authenticated;
