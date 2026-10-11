create policy "Customers read own orders" on public.orders
for select using (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
