-- Check the current server-managed privilege, including sessions issued before
-- the role was assigned. Customers cannot edit auth.users app metadata.
create or replace function public.is_dmaestros_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = 'dmaestros.cl@gmail.com'
      and coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
  );
$$;

revoke all on function public.is_dmaestros_admin() from public;
grant execute on function public.is_dmaestros_admin() to authenticated, anon;

-- Preserve existing profile data and fill any profiles predating the signup trigger.
insert into public.customer_profiles (id, first_name, last_name, email, phone, address, created_at)
select u.id,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', ''),
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.raw_user_meta_data ->> 'address', ''),
  u.created_at
from auth.users as u
where lower(coalesce(u.email, '')) <> 'dmaestros.cl@gmail.com'
  and coalesce(u.raw_app_meta_data ->> 'role', '') <> 'admin'
on conflict (id) do nothing;
