import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { parseShippingSettings, qualifiesForFreeShipping, shippingCostForSubtotal } from "../lib/shipping-policy.ts";

const disabled = { mode: "disabled", minimum_subtotal: null };
const all = { mode: "all", minimum_subtotal: null };
const threshold = { mode: "threshold", minimum_subtotal: 2000 };
const migration = (name) => readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const customerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("shipping policy validates configuration and uses an inclusive products-only threshold", () => {
  assert.deepEqual(parseShippingSettings(disabled), disabled);
  assert.deepEqual(parseShippingSettings({ mode: "threshold", minimum_subtotal: "2000" }), threshold);
  for (const value of [null, {}, { mode: "invalid" }, { mode: "threshold" }, { ...threshold, minimum_subtotal: 0 }, { ...threshold, minimum_subtotal: -1 }, { ...threshold, minimum_subtotal: 2.5 }, { ...threshold, minimum_subtotal: 1000000000 }]) {
    assert.throws(() => parseShippingSettings(value));
  }
  assert.equal(shippingCostForSubtotal(250, 2000, disabled), 250);
  assert.equal(shippingCostForSubtotal(250, 1000, all), 0);
  assert.equal(shippingCostForSubtotal(250, 1999, threshold), 250);
  assert.equal(shippingCostForSubtotal(250, 2000, threshold), 0);
  assert.equal(shippingCostForSubtotal(250, 2001, threshold), 0);
  assert.equal(qualifiesForFreeShipping(0, all), false);
  assert.equal(qualifiesForFreeShipping(NaN, all), false);
});

test("free shipping: actual migration, admin-only persistence and authoritative checkout", async (t) => {
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
  const roles = await migration("20261011180000_admin_live_role");
  await db.exec(roles.slice(0, roles.indexOf("-- Preserve existing profile")));
  const base = await migration("20261010210000_admin_panel");
  for (const table of ["categories", "products", "orders"]) {
    const definition = base.match(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?\\n\\);`));
    assert.ok(definition, table);
    await db.exec(definition[0]);
  }
  await db.exec("alter table public.products add column sale_price numeric(12,2); alter table public.categories add column shipping_rm_only boolean not null default false;");
  for (const name of ["20261010232000_sales_and_store_settings", "20261010233000_checkout_orders", "20261011000000_commune_shipping", "20261011060000_product_manual_availability", "20261013150000_webpay_plus", "20261014210000_free_shipping"]) {
    await db.exec(await migration(name));
  }
  await db.exec(`
    grant usage on schema public,auth to anon,authenticated,service_role;
    insert into public.categories (id,name,slug) values ('11111111-1111-4111-8111-111111111111','Colección','coleccion');
    insert into public.products (sku,name,category_id,price,sale_price,stock,active,available,sale_mode)
      values ('A','Producto','11111111-1111-4111-8111-111111111111',1200,1000,10,true,true,'buy');
    insert into public.shipping_regions (code,name) values ('CL-RM','Metropolitana'),('CL-VS','Valparaíso');
    insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max)
      values ('13101','CL-RM','Santiago',250,1,3);
  `);
  const setRole = async (role, uid = "") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.role',$1,false),set_config('request.jwt.claim.sub',$2,false)", [role, uid]);
    if (role !== "service_role") await db.exec(`set role ${role}`);
  };
  const save = async (settings) => {
    await setRole("authenticated", adminId);
    const { rows } = await db.query("update public.shipping_settings set mode=$1,minimum_subtotal=$2 where id=true returning mode,minimum_subtotal", [settings.mode, settings.minimum_subtotal]);
    assert.equal(rows.length, 1);
    return parseShippingSettings(rows[0]);
  };
  const create = async (overrides = {}) => {
    await setRole("service_role");
    const args = { id: randomUUID(), region: "CL-RM", commune: "13101", total: 2250, quantity: 2, ...overrides };
    const customer = { name: "Cliente", email: "cliente@example.com", phone: "+56912345678", address: "Dirección 123" };
    return (await db.query("select public.create_webpay_order($1,'hash',$2,$3,$4,$5,$6,$7,'integration','597055555532') as payment", [args.id, randomUUID(), customer, [{ sku: "A", quantity: args.quantity }], args.region, args.commune, args.total])).rows[0].payment;
  };
  const order = async (payment) => (await db.query("select shipping_cost,total,shipping_commune from public.orders where id=$1", [payment.order_id])).rows[0];

  await t.test("default off charges the original tariff; admin updates persist", async () => {
    await setRole("anon");
    assert.deepEqual(parseShippingSettings((await db.query("select * from public.shipping_settings")).rows[0]), disabled);
    const payment = await create();
    assert.equal(payment.amount, 2250);
    assert.equal(Number((await order(payment)).shipping_cost), 250);
    assert.deepEqual(await save(all), all);
  });
  await t.test("all-free applies to new payments, keeps base rates, and does not reprice existing attempts", async () => {
    const payment = await create({ total: 2000 });
    assert.equal(payment.amount, 2000);
    assert.equal(Number((await order(payment)).shipping_cost), 0);
    assert.equal(Number((await db.query("select price from public.shipping_rates")).rows[0].price), 250);
    await save(disabled);
    const retry = await create({ id: payment.id, total: 2000 });
    assert.equal(retry.amount, 2000); assert.equal(retry.created, false);
    assert.equal((await create()).amount, 2250);
    await assert.rejects(create({ total: 2000 }), /precio o despacho/);
  });
  await t.test("threshold uses discounted product subtotal, includes equality, and excludes shipping", async () => {
    await save(threshold);
    assert.equal((await create({ total: 2000 })).amount, 2000);
    assert.equal((await create({ quantity: 1, total: 1250 })).amount, 1250);
    assert.equal((await create({ quantity: 3, total: 3000 })).amount, 3000);
    await save({ ...threshold, minimum_subtotal: 2200 });
    assert.equal((await create()).amount, 2250); // List price is 2400; discounted subtotal is 2000.
    await assert.rejects(create({ total: 2000 }), /precio o despacho/);
  });
  await t.test("free shipping does not enable unavailable communes or bypass pickup restrictions", async () => {
    await save(all);
    await assert.rejects(create({ commune: "missing", total: 2000 }), /comuna/);
    await assert.rejects(create({ region: "CL-VS", total: 2000 }), /comuna/);
    await db.exec("update public.shipping_rates set active=false");
    await assert.rejects(create({ total: 2000 }), /comuna/);
    await db.exec("update public.shipping_rates set active=true; update public.categories set shipping_rm_only=true;");
    const pickup = await create({ region: "CL-VS", commune: "", total: 2000 });
    assert.equal((await order(pickup)).shipping_commune, "Retiro en taller");
    await db.exec("update public.categories set shipping_rm_only=false");
  });
  await t.test("changed settings and forged totals fail atomically before creating orders", async () => {
    const before = (await db.query("select count(*) from public.orders")).rows[0].count;
    await assert.rejects(create({ total: 2250 }), /precio o despacho/);
    await assert.rejects(create({ total: 1 }), /precio o despacho/);
    assert.equal((await db.query("select count(*) from public.orders")).rows[0].count, before);
    await save(disabled);
    await assert.rejects(create({ total: 2000 }), /precio o despacho/);
  });
  await t.test("anonymous and customer sessions can read but cannot change promotions or call checkout RPC", async () => {
    await setRole("anon");
    assert.equal((await db.query("select mode from public.shipping_settings")).rows[0].mode, "disabled");
    await assert.rejects(db.query("update public.shipping_settings set mode='all'"), /permission denied/);
    await setRole("authenticated", customerId);
    assert.equal((await db.query("update public.shipping_settings set mode='all' where id=true returning mode")).rows.length, 0);
    await assert.rejects(db.query("insert into public.shipping_settings (id,mode) values (true,'all')"), /permission denied/);
    await assert.rejects(db.query("delete from public.shipping_settings"), /permission denied/);
    await assert.rejects(db.query("select public.create_webpay_order(null,null,null,null,null,null,null,null,null,null)"), /permission denied/);
  });
  await t.test("database rejects invalid thresholds and revoking admin privileges immediately blocks changes", async () => {
    await setRole("authenticated", adminId);
    for (const minimum of [0, -1, null, 1000000000]) {
      await assert.rejects(db.query("update public.shipping_settings set mode='threshold',minimum_subtotal=$1", [minimum]), /check constraint/);
    }
    await setRole("service_role");
    await db.query("update auth.users set raw_app_meta_data='{}' where id=$1", [adminId]);
    await setRole("authenticated", adminId);
    assert.equal((await db.query("update public.shipping_settings set mode='all' returning mode")).rows.length, 0);
  });
});
