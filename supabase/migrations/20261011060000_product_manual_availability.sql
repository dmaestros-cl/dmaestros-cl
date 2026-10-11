alter table public.products
add column if not exists available boolean not null default true;

-- Preserve the current storefront state on migration. From this point onward,
-- availability is controlled manually and is independent from stock.
update public.products
set available = stock > 0
where available is distinct from (stock > 0);
