-- El privilegio se guarda en app_metadata, que no puede ser modificado por el cliente.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = 'dmaestros.cl@gmail.com';

create or replace function public.is_dmaestros_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'dmaestros.cl@gmail.com'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

revoke all on function public.is_dmaestros_admin() from public;
grant execute on function public.is_dmaestros_admin() to authenticated, anon;
