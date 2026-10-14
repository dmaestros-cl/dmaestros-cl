import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("Webpay SQL: atomic orders, authoritative totals, RLS and verified settlement", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role', true) $$;
    create function public.is_dmaestros_admin() returns boolean language sql as $$ select auth.role() = 'authenticated' $$;
  `);
  const base = await readFile(new URL("../supabase/migrations/20261010210000_admin_panel.sql", import.meta.url), "utf8");
  for (const table of ["categories", "products", "orders"]) {
    const definition = base.match(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?\\n\\);`));
    assert.ok(definition, table);
    await db.exec(definition[0]);
  }
  await db.exec(`alter table public.orders enable row level security;
    create policy "Admin manages orders" on public.orders for all using (public.is_dmaestros_admin()) with check (public.is_dmaestros_admin());
    alter table public.products add column sale_price numeric(12,2);
    alter table public.categories add column shipping_rm_only boolean not null default false;`);
  for (const file of ["20261010232000_sales_and_store_settings.sql", "20261010233000_checkout_orders.sql", "20261011000000_commune_shipping.sql", "20261011060000_product_manual_availability.sql", "20261013150000_webpay_plus.sql", "20261013203000_order_email_notifications.sql", "20261014210000_free_shipping.sql"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  }
  await db.exec(`
    select set_config('request.jwt.claim.role', 'service_role', false);
    insert into public.categories (id,name,slug) values ('11111111-1111-4111-8111-111111111111','Pruebas','pruebas');
    insert into public.products (sku,name,category_id,price,sale_price,stock,active,available,sale_mode)
    values ('A','Producto prueba','11111111-1111-4111-8111-111111111111',1200,1000,10,true,true,'buy');
    insert into public.shipping_regions (code,name) values ('CL-RM','Metropolitana'),('CL-VS','Valparaíso');
    insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max)
      values ('13101','CL-RM','Santiago',250,1,3);
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant all on public.orders, public.order_items to anon,authenticated,service_role;
    grant usage,select on all sequences in schema public to anon,authenticated,service_role;
  `);
  const customer = { name: "Cliente prueba", email: "prueba@example.com", phone: "+56912345678", address: "Dirección de prueba 123" };
  const create = async (overrides = {}) => {
    const args = { id: randomUUID(), hash: "same-payload", clientHash: randomUUID(), items: [{ sku: "A", quantity: 2 }], region: "CL-RM", commune: "13101", total: 2250, ...overrides };
    const { rows } = await db.query(`select public.create_webpay_order($1,$2,$3,$4,$5,$6,$7,$8,'integration','597055555532') as payment`, [args.id, args.hash, args.clientHash, customer, args.items, args.region, args.commune, args.total]);
    return rows[0].payment;
  };
  const finish = async (payment, changes = {}, event = "commit") => {
    const result = { amount: payment.amount, buy_order: payment.buy_order, session_id: payment.session_id, status: "AUTHORIZED", response_code: 0, authorization_code: "123456", payment_type_code: "VD", card_detail: { card_number: "6623" }, ...changes };
    const { rows } = await db.query("select public.finish_webpay_payment($1,$2,$3) as state", [payment.id, result, event]);
    return rows[0].state;
  };
  await t.test("creates order and lines atomically with database sale price and shipping", async () => {
    const payment = await create();
    assert.equal(payment.amount, 2250); assert.equal(payment.created, true);
    assert.ok(payment.buy_order.length <= 26);
    const { rows } = await db.query("select * from public.order_items where order_id=$1", [payment.order_id]);
    assert.equal(Number(rows[0].unit_price), 1000); assert.equal(rows[0].quantity, 2);
    const repeated = await create({ id: payment.id });
    assert.equal(repeated.created, false); assert.equal(repeated.order_id, payment.order_id);
    await assert.rejects(create({ id: payment.id, hash: "different" }), /otra compra/);
  });
  await t.test("rejects manipulated totals, invalid quantities, duplicate products and wrong commune", async () => {
    const before = (await db.query("select count(*) from public.orders")).rows[0].count;
    await assert.rejects(create({ total: 1 }), /precio o despacho/);
    await assert.rejects(create({ items: [{ sku: "A", quantity: -2 }] }), /Cantidad/);
    await assert.rejects(create({ items: [{ sku: "A", quantity: 11 }] }), /stock/);
    await assert.rejects(create({ items: [{ sku: "A", quantity: 1 }, { sku: "A", quantity: 1 }] }), /duplicados/);
    await assert.rejects(create({ region: "CL-VS" }), /comuna/);
    await assert.rejects(create({ items: [{ sku: "missing", quantity: 1 }] }), /disponible/);
    assert.equal((await db.query("select count(*) from public.orders")).rows[0].count, before);
  });
  await t.test("validates pickup restriction using the category, not browser shipping costs", async () => {
    await db.exec("update public.categories set shipping_rm_only=true");
    const payment = await create({ region: "CL-VS", commune: "", total: 2000 });
    assert.equal(payment.amount, 2000);
    assert.equal((await db.query("select shipping_commune from public.orders where id=$1", [payment.order_id])).rows[0].shipping_commune, "Retiro en taller");
    await db.exec("update public.categories set shipping_rm_only=false");
  });
  await t.test("refuses amount/session mismatch and fake approval; verified approval is idempotent", async () => {
    const payment = await create();
    await assert.rejects(finish(payment, { amount: 1 }), /mismatch/);
    await assert.rejects(finish(payment, { session_id: "wrong" }), /mismatch/);
    assert.notEqual(await finish(payment, { response_code: "0" }), "authorized");
    assert.equal(await finish(payment), "authorized");
    assert.equal(await finish(payment), "authorized");
    assert.equal(await finish(payment, { status: "INITIALIZED" }, "cancel"), "authorized");
    const order = (await db.query("select status,payment_status,payment_environment from public.orders where id=$1", [payment.order_id])).rows[0];
    assert.deepEqual(order, { status: "pagado", payment_status: "authorized", payment_environment: "integration" });
  });
  await t.test("records rejection, cancellation and timeout without approval", async () => {
    assert.equal(await finish(await create(), { status: "FAILED", response_code: -1 }), "failed");
    assert.equal(await finish(await create(), { status: "INITIALIZED" }, "cancel"), "cancelled");
    assert.equal(await finish(await create(), { status: "INITIALIZED" }, "timeout"), "expired");
  });
  await t.test("emails queue only on verified approval, lock concurrent sends and freeze retry payloads", async () => {
    const payment = await create();
    const jobs = () => db.query("select * from public.order_email_notifications where order_id=$1 order by audience", [payment.order_id]);
    const claim = (payload = { subject: "original", to: ["test@example.com"] }) => db.query("select public.claim_order_email($1,'customer',$2) as job", [payment.order_id, payload]);
    assert.equal((await jobs()).rows.length, 0);
    assert.equal((await claim()).rows[0].job, null);
    await finish(payment);
    await finish(payment);
    assert.equal((await jobs()).rows.length, 2);
    assert.equal((await claim()).rows[0].job.attempts, 1);
    assert.equal((await claim()).rows[0].job, null);
    await db.query("update public.order_email_notifications set locked_until=null,state='failed' where order_id=$1 and audience='customer'", [payment.order_id]);
    assert.equal((await claim({ subject: "changed" })).rows[0].job.payload.subject, "original");
    await db.query("update public.order_email_notifications set locked_until=null,first_attempt_at=now()-interval '24 hours' where order_id=$1 and audience='customer'", [payment.order_id]);
    assert.equal((await claim()).rows[0].job, null);
    assert.equal((await jobs()).rows.find((job) => job.audience === "customer").state, "review");
    await db.query("update public.order_email_notifications set state='sent' where order_id=$1 and audience='admin'", [payment.order_id]);
    assert.equal((await db.query("select public.claim_order_email($1,'admin','{}') as job", [payment.order_id])).rows[0].job, null);
    await db.exec("set role anon; select set_config('request.jwt.claim.role','anon',false)");
    await assert.rejects(jobs(), /permission denied/);
    await assert.rejects(claim(), /permission denied/);
    await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false)");
    await db.query("delete from public.webpay_transactions where order_id=$1", [payment.order_id]);
    await db.query("delete from public.orders where id=$1", [payment.order_id]);
    assert.equal((await jobs()).rows.length, 0);
  });
  await t.test("RLS denies guest payment records and direct order writes", async () => {
    await db.exec("set role anon; select set_config('request.jwt.claim.role','anon',false)");
    await assert.rejects(db.query("select * from public.webpay_transactions"), /permission denied/);
    await assert.rejects(create(), /permission denied/);
    await assert.rejects(db.query("insert into public.orders (customer_name,customer_email,total) values ('bad','bad@example.com',1)"), /row-level security/);
    await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false)");
  });
  await t.test("admin cannot fake Webpay approval or ship test orders", async () => {
    const pending = await create();
    const paid = await create(); await finish(paid);
    await db.exec("set role authenticated; select set_config('request.jwt.claim.role','authenticated',false)");
    await assert.rejects(db.query("update public.orders set status='pagado' where id=$1", [pending.order_id]), /Transbank/);
    await assert.rejects(db.query("update public.orders set shipping_status='despachado' where id=$1", [paid.order_id]), /Transbank/);
    await assert.rejects(db.query("update public.orders set payment_environment='production' where id=$1", [paid.order_id]), /Transbank/);
    await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false)");
  });
});
