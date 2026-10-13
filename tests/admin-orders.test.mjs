import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { orderActionError, orderNumber } from "../lib/admin-orders.ts";

const migration = (name) => readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const customerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const details = { customer_name: "Cliente prueba", customer_email: "cliente@example.com", customer_phone: "+56912345678", shipping_address: "Calle de prueba 123", shipping_region: "Metropolitana", shipping_commune: "Santiago" };

test("order labels and safe error messages", () => {
  assert.equal(orderNumber({ order_number: 2 }), "00002");
  assert.equal(orderNumber({ order_number: 100000 }), "100000");
  assert.equal(orderActionError({ message: "ORDER:No existe." }), "No existe.");
  assert.doesNotMatch(orderActionError({ message: "database sensitive detail" }), /sensitive/);
});

test("admin order actions against isolated PostgreSQL and actual migrations", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role',true) $$;
    insert into auth.users values ('${adminId}','dmaestros.cl@gmail.com','{"role":"admin"}'),('${customerId}','cliente@example.com','{}');
  `);
  // Use the real server-managed admin check, not a role stub that treats customers as administrators.
  const roles = await migration("20261011180000_admin_live_role");
  await db.exec(roles.slice(0, roles.indexOf("-- Preserve existing profile")));
  const base = await migration("20261010210000_admin_panel");
  for (const table of ["categories", "products", "orders"]) {
    const definition = base.match(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?\\n\\);`));
    assert.ok(definition, table); await db.exec(definition[0]);
  }
  await db.exec(`
    alter table public.orders enable row level security;
    create policy "Admin manages orders" on public.orders for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
    alter table public.products add column sale_price numeric(12,2);
    alter table public.categories add column shipping_rm_only boolean not null default false;
  `);
  for (const file of ["20261010232000_sales_and_store_settings", "20261010233000_checkout_orders", "20261011000000_commune_shipping", "20261011060000_product_manual_availability", "20261013150000_webpay_plus", "20261013190000_admin_order_actions"]) {
    await db.exec(await migration(file));
  }
  await db.exec(`
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant all on public.orders,public.order_items to anon,authenticated,service_role;
    insert into public.categories (id,name,slug) values ('11111111-1111-4111-8111-111111111111','Pruebas','pruebas');
    insert into public.products (sku,name,category_id,price,stock,active,available,sale_mode) values ('A','Producto prueba','11111111-1111-4111-8111-111111111111',1000,10,true,true,'buy');
    insert into public.shipping_regions (code,name) values ('CL-RM','Metropolitana');
    insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values ('13101','CL-RM','Santiago',250,1,3);
  `);
  const setRole = async (role, uid = "") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.role',$1,false),set_config('request.jwt.claim.sub',$2,false)", [role, uid]);
    if (role !== "service_role") await db.exec(`set role ${role}`);
  };
  const createOrder = async (environment = "integration", authorized = false) => {
    await setRole("service_role");
    const customer = { name: details.customer_name, email: details.customer_email, phone: details.customer_phone, address: details.shipping_address };
    const { rows } = await db.query("select public.create_webpay_order($1,'test',$2,$3,$4,'CL-RM','13101',2250,$5,'597055555532') as payment", [randomUUID(), randomUUID(), customer, [{ sku: "A", quantity: 2 }], environment]);
    const payment = rows[0].payment;
    if (authorized) await db.query("select public.finish_webpay_payment($1,$2,'commit')", [payment.id, { buy_order: payment.buy_order, session_id: payment.session_id, amount: payment.amount, status: "AUTHORIZED", response_code: 0 }]);
    const order = (await db.query("select * from public.orders where id=$1", [payment.order_id])).rows[0];
    await setRole("authenticated", adminId);
    return { ...order, payment };
  };
  const update = async (order, values = details, version = order.details_version) => (await db.query("select public.admin_update_order_details($1,$2,$3) as result", [order.id, version, values])).rows[0].result;
  const remove = async (order, number = order.order_number) => (await db.query("select public.admin_delete_order($1,$2) as result", [order.id, number])).rows[0].result;
  const counts = async (id) => {
    await setRole("service_role");
    return (await db.query(`select (select count(*)::int from public.orders where id=$1) as orders,
      (select count(*)::int from public.order_items where order_id=$1) as items,
      (select count(*)::int from public.webpay_transactions where order_id=$1) as payments`, [id])).rows[0];
  };

  await t.test("editing trims contact fields without changing payment, totals, order items or accounts", async () => {
    const order = await createOrder("integration", true);
    const changed = await update(order, { ...details, customer_name: "  Nuevo nombre  ", customer_email: " NUEVO@example.com ", customer_phone: " +56952024079 ", shipping_address: "Nueva dirección 123" });
    assert.equal(changed.customer_name, "Nuevo nombre"); assert.equal(changed.customer_email, "nuevo@example.com");
    assert.equal(changed.customer_phone, "+56952024079"); assert.equal(changed.details_version, 1);
    for (const key of ["status", "payment_status", "payment_environment", "shipping_rate_code"]) assert.equal(changed[key], order[key], key);
    for (const key of ["total", "shipping_cost"]) assert.equal(Number(changed[key]), Number(order[key]), key);
    assert.deepEqual(await counts(order.id), { orders: 1, items: 1, payments: 1 });
    assert.equal((await db.query("select email from auth.users where id=$1", [customerId])).rows[0].email, "cliente@example.com");
  });
  await t.test("address change clears stale shipping rate but preserves billed shipping", async () => {
    const order = await createOrder();
    const changed = await update(order, { ...details, shipping_commune: "Providencia" });
    assert.equal(changed.shipping_rate_code, null); assert.equal(Number(changed.shipping_cost), 250); assert.equal(Number(changed.total), 2250);
  });
  await t.test("rejects invalid fields, forged amounts and stale changes", async () => {
    const order = await createOrder();
    for (const invalid of [null, [], { ...details, total: 1 }, { ...details, customer_email: "invalid" }, { ...details, customer_phone: "phone" }, { ...details, customer_name: "x" }, { ...details, shipping_address: "x".repeat(501) }, { ...details, shipping_region: null }]) {
      await assert.rejects(update(order, invalid), /ORDER:/);
    }
    await update(order, { ...details, customer_name: "Primer cambio" });
    await assert.rejects(update(order, { ...details, customer_name: "Cambio obsoleto" }), /cambió/);
    await assert.rejects(update({ ...order, id: randomUUID() }), /ya no existe/);
  });
  await t.test("anonymous and customer sessions cannot edit or delete any order", async () => {
    const order = await createOrder();
    await setRole("anon");
    await assert.rejects(update(order), /permission denied/); await assert.rejects(remove(order), /permission denied/);
    await setRole("authenticated", customerId);
    await assert.rejects(update(order), /Solo un administrador/); await assert.rejects(remove(order), /Solo un administrador/);
    assert.equal((await db.query("delete from public.orders where id=$1 returning id", [order.id])).rows.length, 0);
    assert.deepEqual(await counts(order.id), { orders: 1, items: 1, payments: 1 });
  });
  await t.test("revoking administrator metadata immediately denies the existing session", async () => {
    const order = await createOrder();
    await setRole("service_role"); await db.query("update auth.users set raw_app_meta_data='{}' where id=$1", [adminId]);
    await setRole("authenticated", adminId);
    await assert.rejects(remove(order), /Solo un administrador/);
    await setRole("service_role"); await db.query("update auth.users set raw_app_meta_data=$2 where id=$1", [adminId, { role: "admin" }]);
  });
  await t.test("deletion removes exactly the selected order, lines and test payment; keeps accounts, catalog and other orders", async () => {
    const keep = await createOrder(); const order = await createOrder("integration", true);
    await assert.rejects(remove(order, Number(order.order_number) + 100), /confirmación no coincide/);
    assert.equal((await remove(order)).deleted, true);
    assert.deepEqual(await counts(order.id), { orders: 0, items: 0, payments: 0 });
    assert.deepEqual(await counts(keep.id), { orders: 1, items: 1, payments: 1 });
    assert.equal((await db.query("select count(*)::int as count from public.products")).rows[0].count, 1);
    assert.equal((await db.query("select count(*)::int as count from auth.users")).rows[0].count, 2);
    assert.equal((await db.query("select count(*)::int as count from public.webpay_transactions where receipt_id=$1", [order.payment.receipt_id])).rows[0].count, 0);
    await setRole("authenticated", adminId); await assert.rejects(remove(order), /ya no existe/);
  });
  await t.test("blocks an active verification and pending real payments, allows a settled payment", async () => {
    const pending = await createOrder("production");
    await assert.rejects(remove(pending), /pago real pendiente/);
    const order = await createOrder();
    await setRole("service_role"); await db.query("update public.webpay_transactions set processing_until=now()+interval '1 minute' where order_id=$1", [order.id]);
    await setRole("authenticated", adminId); await assert.rejects(remove(order), /está verificando/);
    const settled = await createOrder("production", true);
    assert.equal((await remove(settled)).deleted, true);
  });
  await t.test("an error after child deletion rolls back all records atomically", async () => {
    const order = await createOrder();
    await setRole("service_role");
    await db.exec(`create function public.fail_test_delete() returns trigger language plpgsql as $$ begin raise exception 'test rollback'; end; $$;
      create trigger fail_test_delete before delete on public.orders for each row execute function public.fail_test_delete();`);
    await setRole("authenticated", adminId); await assert.rejects(remove(order), /test rollback/);
    assert.deepEqual(await counts(order.id), { orders: 1, items: 1, payments: 1 });
    await db.exec("drop trigger fail_test_delete on public.orders; drop function public.fail_test_delete()");
  });
  await t.test("manual orders can also be edited and deleted", async () => {
    await setRole("service_role");
    const order = (await db.query("insert into public.orders (customer_name,customer_email,total) values ('Manual','manual@example.com',1000) returning *")).rows[0];
    await setRole("authenticated", adminId);
    const changed = await update(order);
    assert.equal(changed.customer_name, details.customer_name); assert.equal(changed.details_version, 1);
    assert.equal((await remove(order)).deleted, true);
  });
});
