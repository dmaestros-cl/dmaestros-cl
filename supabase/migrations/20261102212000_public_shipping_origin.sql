begin;

-- An origin remains usable when delivery to that commune is disabled.
-- Checkout still filters active destinations; other disabled communes stay hidden.
create policy "Public reads configured shipping origin" on public.shipping_rates
for select using (commune_code = (select origin_commune_code from public.shipping_settings where id=true));

commit;
