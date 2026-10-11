create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;
create policy "Customers read own profile" on public.customer_profiles for select using (auth.uid() = id);
create policy "Customers update own profile" on public.customer_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_customer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) <> 'dmaestros.cl@gmail.com' then
    insert into public.customer_profiles (id,first_name,last_name,email,phone,address)
    values (new.id, coalesce(new.raw_user_meta_data->>'first_name',''), coalesce(new.raw_user_meta_data->>'last_name',''), coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'phone',''), coalesce(new.raw_user_meta_data->>'address',''))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_customer_created on auth.users;
create trigger on_auth_customer_created after insert on auth.users for each row execute procedure public.handle_new_customer();
