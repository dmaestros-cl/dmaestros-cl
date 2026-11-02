import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { parseShippingSettings, qualifiesForFreeShipping, shippingCostForSubtotal } from "../lib/shipping-policy.ts";
import { productShipsOnlyToRM } from "../lib/product-shipping.ts";
import { parseProductShippingPrice, productShippingCost, productShippingQuote, parseShippingRules, DEFAULT_SHIPPING_RULES } from "../lib/product-shipping-price.ts";

const disabled = { mode: "disabled", minimum_subtotal: null };
const all = { mode: "all", minimum_subtotal: null };
const threshold = { mode: "threshold", minimum_subtotal: 2000 };
const migration = (name) => readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const customerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("product shipping prices distinguish inherited, free and per-unit fees", () => {
  for (const value of [null, undefined, "", "  "]) assert.equal(parseProductShippingPrice(value), null);
  assert.equal(parseProductShippingPrice("0"), 0);
  assert.equal(parseProductShippingPrice("5000"), 5000);
  for (const value of [-1, 1.5, NaN, Infinity, "abc", true, {}, 1000000000]) assert.throws(() => parseProductShippingPrice(value));
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 2 }, { shippingPrice: 8000, quantity: 1 }], 3000), 18000);
  assert.equal(productShippingCost([{ shippingPrice: 0, quantity: 3 }], 3000), 0);
  assert.equal(productShippingCost([{ shippingPrice: null, quantity: 2 }, { shippingPrice: null, quantity: 1 }], 3000), 3000);
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 2 }, { shippingPrice: null, quantity: 3 }], 3000), 13000);
  assert.throws(() => productShippingCost([{ shippingPrice: 100, quantity: 0 }], 3000));
  assert.throws(() => productShippingCost([{ shippingPrice: null, quantity: 1 }], NaN));
});

test("product coverage overrides its category, while unconfigured products inherit it", () => {
  for (const category of [true, false]) {
    assert.equal(productShipsOnlyToRM("rm", category), true);
    assert.equal(productShipsOnlyToRM("chile", category), false);
    assert.equal(productShipsOnlyToRM(null, category), category);
    assert.equal(productShipsOnlyToRM(undefined, category), category);
  }
});

test("custom rules use inclusive unit thresholds, configurable percentages, highest fee and peso rounding", () => {
  const discount = { ...DEFAULT_SHIPPING_RULES, quantity_discount_enabled: true };
  assert.deepEqual(parseShippingRules(DEFAULT_SHIPPING_RULES), DEFAULT_SHIPPING_RULES);
  for (const value of [null, {}, { ...discount, calculation_mode: "invalid" }, { ...discount, quantity_discount_enabled: "true" }, { ...discount, quantity_discount_min_units: 0 }, { ...discount, quantity_discount_percent: 101 }, { ...discount, quantity_discount_percent: 1.5 }]) assert.throws(() => parseShippingRules(value));
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 2 }], 3000, discount), 10000);
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 3 }], 3000, discount), 7500);
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 3 }], 3000, { ...discount, quantity_discount_min_units: 4 }), 15000);
  assert.equal(productShippingCost([{ shippingPrice: 5000, quantity: 4 }], 3000, { ...discount, quantity_discount_min_units: 4 }), 10000);
  const mixed = [{ shippingPrice: 5001, quantity: 1 }, { shippingPrice: 10000, quantity: 2 }];
  assert.deepEqual(productShippingQuote(mixed, 3000, discount), { base: 25001, discount: 12500, total: 12501 });
  assert.equal(productShippingCost(mixed, 3000, { ...discount, calculation_mode: "highest" }), 5000);
  assert.equal(productShippingCost([{ shippingPrice: null, quantity: 4 }], 3000, discount), 1500);
  assert.equal(productShippingCost(mixed, 3000, { ...discount, quantity_discount_percent: 100 }), 0);
});

test("initial coverage follows the requested categories and includes products without a category", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create table public.categories (id integer primary key, name text, active boolean, shipping_rm_only boolean);
    create table public.products (sku text primary key, category_id integer, shipping_scope text);
    insert into public.categories values
      (1,'Muebles',true,false),(2,'Muebles a Pedido',true,false),(3,'Comedores',true,false),
      (4,'Espejos',true,false),(5,'Coffe / Bar',true,false),(6,'Mascotas',true,false),
      (7,'Cajas para corchos',true,false),(8,'Destapadores de cerveza',true,false);
    insert into public.products select id::text,id,null from public.categories;
    insert into public.products values ('uncategorized',null,null),('custom',1,'chile');
  `);
  await db.exec(await migration("20261101221000_shipping_labels_initial"));
  const { rows } = await db.query("select sku,shipping_scope from public.products order by sku");
  assert.deepEqual(Object.fromEntries(rows.map(row => [row.sku, row.shipping_scope])), {
    1: "rm", 2: "rm", 3: "rm", 4: "rm", 5: "rm", 6: "chile", 7: "chile", 8: "chile", custom: "chile", uncategorized: "chile",
  });
});

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
  await db.exec("alter table public.products enable row level security; grant select,insert,update,delete on public.products to anon,authenticated;");
  for (const policy of ["Public reads active products", "Admin manages products"]) {
    await db.exec(base.match(new RegExp(`create policy "${policy}"[^;]+;`))[0]);
  }
  await db.exec("alter table public.products add column sale_price numeric(12,2); alter table public.categories add column shipping_rm_only boolean not null default false;");
  for (const name of ["20261010232000_sales_and_store_settings", "20261010233000_checkout_orders", "20261011000000_commune_shipping", "20261011060000_product_manual_availability", "20261013150000_webpay_plus", "20261014210000_free_shipping", "20261101220000_product_shipping_scope", "20261102150000_product_shipping_price", "20261102160000_custom_shipping_rules", "20261102210000_blue_express_shipping", "20261102211000_blue_pyme_tariff"]) {
    await db.exec(await migration(name));
  }
  await db.exec(`
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant select on public.shipping_rates to anon,authenticated;
    insert into public.categories (id,name,slug) values ('11111111-1111-4111-8111-111111111111','Colección','coleccion');
    insert into public.products (sku,name,category_id,price,sale_price,stock,active,available,sale_mode)
      values ('A','Producto','11111111-1111-4111-8111-111111111111',1200,1000,10,true,true,'buy');
    insert into public.shipping_regions (code,name) values ('CL-RM','Metropolitana'),('CL-VS','Valparaíso');
    insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max)
      values ('13101','CL-RM','Santiago',250,1,3);
    update public.shipping_rates set blue_zone='santiago' where commune_code='13101';
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
    return (await db.query("select public.create_webpay_order($1,'hash',$2,$3,$4,$5,$6,$7,'integration','597055555532') as payment", [args.id, randomUUID(), customer, args.items ?? [{ sku: "A", quantity: args.quantity }], args.region, args.commune, args.total])).rows[0].payment;
  };
  const order = async (payment) => (await db.query("select shipping_cost,total,shipping_commune from public.orders where id=$1", [payment.order_id])).rows[0];

  await db.exec(await migration("20261102212000_public_shipping_origin"));
  await t.test("disabled delivery does not hide the origin needed for other destinations", async () => {
    await setRole("service_role");
    await db.exec("update public.shipping_settings set origin_commune_code='13101'; update public.shipping_rates set active=false where commune_code='13101'");
    await setRole("anon");
    assert.equal((await db.query("select region_code,blue_zone from public.shipping_rates where commune_code='13101'")).rows.length, 1);
    assert.equal((await db.query("select commune_code from public.shipping_rates where active")).rows.length, 0);
    await setRole("service_role");
    await db.exec("update public.shipping_settings set origin_commune_code=null");
    await setRole("anon");
    assert.equal((await db.query("select commune_code from public.shipping_rates")).rows.length, 0);
    await setRole("service_role");
    await db.exec("update public.shipping_rates set active=true where commune_code='13101'");
  });

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
  await t.test("administrators can save product coverage, but shoppers cannot change it", async () => {
    await setRole("authenticated", adminId);
    assert.equal((await db.query("update public.products set shipping_scope='rm' where sku='A' returning shipping_scope")).rows[0].shipping_scope, "rm");
    for (const [role, uid] of [["anon", ""], ["authenticated", customerId]]) {
      await setRole(role, uid);
      assert.equal((await db.query("select shipping_scope from public.products where sku='A'")).rows[0].shipping_scope, "rm");
      assert.equal((await db.query("update public.products set shipping_scope='chile' where sku='A' returning shipping_scope")).rows.length, 0);
    }
    await setRole("authenticated", adminId);
    assert.equal((await db.query("update public.products set shipping_scope='chile' where sku='A' returning shipping_scope")).rows[0].shipping_scope, "chile");
    await setRole("service_role");
    await db.exec("update public.products set shipping_scope=null where sku='A'");
  });
  await t.test("changed settings and forged totals fail atomically before creating orders", async () => {
    const before = (await db.query("select count(*) from public.orders")).rows[0].count;
    await assert.rejects(create({ total: 2250 }), /precio o despacho/);
    await assert.rejects(create({ total: 1 }), /precio o despacho/);
    assert.equal((await db.query("select count(*) from public.orders")).rows[0].count, before);
    await save(disabled);
    await assert.rejects(create({ total: 2000 }), /precio o despacho/);
  });
  await t.test("product labels govern shipping inside/outside RM and in mixed carts", async () => {
    await setRole("service_role");
    await db.exec(`
      insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max)
        values ('05101','CL-VS','Valparaíso',350,2,4);
      update public.shipping_rates set blue_zone='centro' where commune_code='05101';
      update public.products set shipping_scope='rm' where sku='A';
    `);
    const pickup = await create({ region: "CL-VS", commune: "05101", total: 2000 });
    assert.equal((await order(pickup)).shipping_commune, "Retiro en taller");
    assert.equal(Number((await order(pickup)).shipping_cost), 0);
    assert.equal((await order(await create())).shipping_commune, "Santiago");
    await assert.rejects(create({ region: "CL-VS", commune: "05101", total: 2350 }), /precio o despacho/);

    await db.exec("update public.categories set shipping_rm_only=true; update public.products set shipping_scope='chile' where sku='A';");
    const national = await create({ region: "CL-VS", commune: "05101", total: 2350 });
    assert.equal((await order(national)).shipping_commune, "Valparaíso");
    assert.equal(Number((await order(national)).shipping_cost), 350);
    await db.exec(`insert into public.products (sku,name,category_id,price,stock,active,available,sale_mode,shipping_scope)
      values ('B','Solo RM','11111111-1111-4111-8111-111111111111',500,10,true,true,'buy','rm');`);
    const mixed = await create({ region: "CL-VS", commune: "05101", total: 1500, items: [{ sku: "A", quantity: 1 }, { sku: "B", quantity: 1 }] });
    assert.equal((await order(mixed)).shipping_commune, "Retiro en taller");
    await assert.rejects(db.exec("update public.products set shipping_scope='invalid' where sku='A'"), /check constraint/);
    await db.exec("update public.products set shipping_scope=null where sku='A'");
    assert.equal((await order(await create({ region: "CL-VS", commune: "", total: 2000 }))).shipping_commune, "Retiro en taller");
    await db.exec("update public.categories set shipping_rm_only=false");
  });
  await t.test("administrators save per-product prices; shoppers can read but cannot alter them", async () => {
    await setRole("authenticated", adminId);
    assert.equal((await db.query("update public.products set shipping_price=400 where sku='A' returning shipping_price")).rows[0].shipping_price, 400);
    for (const [role, uid] of [["anon", ""], ["authenticated", customerId]]) {
      await setRole(role, uid);
      assert.equal((await db.query("select shipping_price from public.products where sku='A'")).rows[0].shipping_price, 400);
      assert.equal((await db.query("update public.products set shipping_price=0 where sku='A' returning shipping_price")).rows.length, 0);
    }
    await setRole("service_role");
    for (const price of [-1, 1000000000]) await assert.rejects(db.query("update public.products set shipping_price=$1 where sku='A'", [price]), /check constraint/);
  });
  await t.test("checkout sums configured shipping per unit and retains one inherited commune fee", async () => {
    await setRole("service_role");
    await db.exec("update public.products set shipping_price=600 where sku='B'");
    const sameProduct = await create({ total: 2800 });
    assert.equal(Number((await order(sameProduct)).shipping_cost), 800);
    const items = [{ sku: "A", quantity: 2 }, { sku: "B", quantity: 3 }];
    const mixed = await create({ items, total: 6100 });
    assert.equal(Number((await order(mixed)).shipping_cost), 2600);
    await db.exec("update public.products set shipping_price=null where sku='B'");
    const inherited = await create({ items, total: 4550 });
    assert.equal(Number((await order(inherited)).shipping_cost), 1050);
    await assert.rejects(create({ total: 2250 }), /precio o despacho/);
    // An already-created attempt keeps the amount it was approved to request.
    await db.exec("update public.products set shipping_price=500 where sku='A'");
    assert.equal((await create({ id: sameProduct.id, total: 2800 })).amount, 2800);
    const before = (await db.query("select count(*) from public.orders")).rows[0].count;
    await assert.rejects(create({ total: 2800 }), /precio o despacho/);
    assert.equal((await db.query("select count(*) from public.orders")).rows[0].count, before);
  });
  await t.test("free product shipping, promotions and RM pickup take precedence without enabling unavailable communes", async () => {
    await db.exec("update public.products set shipping_price=0 where sku='A'");
    assert.equal(Number((await order(await create({ total: 2000 }))).shipping_cost), 0);
    await assert.rejects(create({ commune: "missing", total: 2000 }), /comuna/);
    await db.exec("update public.products set shipping_price=500 where sku='A'");
    await save(all);
    assert.equal(Number((await order(await create({ total: 2000 }))).shipping_cost), 0);
    await save(threshold);
    assert.equal((await create({ total: 2000 })).amount, 2000);
    assert.equal((await create({ quantity: 1, total: 1500 })).amount, 1500);
    await save(disabled);
    await db.exec("update public.products set shipping_scope='rm' where sku='A'");
    const pickup = await create({ region: "CL-VS", commune: "05101", total: 2000 });
    assert.equal((await order(pickup)).shipping_commune, "Retiro en taller");
    assert.equal(Number((await order(pickup)).shipping_cost), 0);
    await db.exec("update public.products set shipping_price=null,shipping_scope=null where sku='A'");
    assert.equal((await create()).amount, 2250);
  });
  await t.test("admin-configured quantity rules control authoritative checkout and reject stale totals", async () => {
    await setRole("authenticated", adminId);
    assert.deepEqual(parseShippingRules((await db.query("select * from public.shipping_settings")).rows[0]), DEFAULT_SHIPPING_RULES);
    const saved = (await db.query("update public.shipping_settings set quantity_discount_enabled=true,quantity_discount_min_units=3,quantity_discount_percent=50 returning *")).rows[0];
    assert.equal(parseShippingRules(saved).quantity_discount_enabled, true);
    await db.exec("update public.products set shipping_price=500 where sku='A'");
    assert.equal((await create({ quantity: 2, total: 3000 })).amount, 3000);
    const payment = await create({ quantity: 3, total: 3750 });
    assert.equal(Number((await order(payment)).shipping_cost), 750);
    await db.exec("update public.shipping_settings set quantity_discount_min_units=4");
    assert.equal((await create({ id: payment.id, quantity: 3, total: 3750 })).created, false);
    const before = (await db.query("select count(*) from public.orders")).rows[0].count;
    await assert.rejects(create({ quantity: 3, total: 3750 }), /precio o despacho/);
    assert.equal((await db.query("select count(*) from public.orders")).rows[0].count, before);
    assert.equal((await create({ quantity: 3, total: 4500 })).amount, 4500);
    assert.equal((await create({ quantity: 4, total: 5000 })).amount, 5000);
    await db.exec("update public.shipping_settings set calculation_mode='highest'");
    assert.equal((await create({ quantity: 4, total: 4250 })).amount, 4250);
    await db.exec("update public.shipping_settings set calculation_mode='per_unit',quantity_discount_min_units=3; update public.products set shipping_price=5001 where sku='A'");
    assert.equal(Number((await order(await create({ quantity: 3, total: 10502 }))).shipping_cost), 7502);
    await save(all);
    assert.equal((await create({ quantity: 3, total: 3000 })).amount, 3000);
    await save(disabled);
    await db.exec("update public.products set shipping_scope='rm' where sku='A'");
    assert.equal((await order(await create({ quantity: 3, region: 'CL-VS', commune: '', total: 3000 }))).shipping_commune, "Retiro en taller");
    await db.exec("update public.products set shipping_price=null,shipping_scope=null where sku='A'; update public.shipping_settings set quantity_discount_enabled=false");
    assert.equal((await create()).amount, 2250);
  });
  await t.test("shipping rules remain admin-only and invalid rules are rejected by the database", async () => {
    for (const [role, uid] of [["anon", ""], ["authenticated", customerId]]) {
      await setRole(role, uid);
      assert.equal(parseShippingRules((await db.query("select * from public.shipping_settings")).rows[0]).quantity_discount_enabled, false);
      if (role === "anon") await assert.rejects(db.query("update public.shipping_settings set quantity_discount_enabled=true"), /permission denied/);
      else assert.equal((await db.query("update public.shipping_settings set quantity_discount_enabled=true returning *")).rows.length, 0);
    }
    await setRole("authenticated", adminId);
    for (const update of ["quantity_discount_min_units=0", "quantity_discount_min_units=4951", "quantity_discount_percent=0", "quantity_discount_percent=101", "calculation_mode='invalid'"]) await assert.rejects(db.exec(`update public.shipping_settings set ${update}`), /check constraint/);
  });
  await t.test("Blue Emprendedores tariffs, measurements, admin overrides and checkout agree", async () => {
    await setRole("authenticated", adminId);
    await assert.rejects(db.exec("update public.products set shipping_automatic=true where sku='A'"), /check constraint/);
    await db.exec("update public.products set shipping_automatic=true,package_weight_kg=1,package_length_cm=30,package_width_cm=30,package_height_cm=30 where sku='A'");
    await assert.rejects(create({ total: 20400,region: 'CL-VS',commune:'05101' }), /origen/);
    await setRole("authenticated", adminId);
    await db.exec("update public.shipping_settings set origin_commune_code='13101'");
    const automatic = await create({ total:20400,region:'CL-VS',commune:'05101' });
    assert.equal(Number((await order(automatic)).shipping_cost),18400);
    assert.equal((await create({total:12800})).amount,12800);
    await assert.rejects(create({total:2350,region:'CL-VS',commune:'05101'}),/precio o despacho/);
    await setRole("authenticated",adminId);
    await db.exec("update public.blue_pyme_tariffs set l=8000 where region_code='central'");
    assert.equal((await create({total:18000,region:'CL-VS',commune:'05101'})).amount,18000);
    assert.equal((await create({id:automatic.id,total:20400,region:'CL-VS',commune:'05101'})).created,false);
    await db.exec("update public.shipping_rates set blue_l=1200 where commune_code='05101'");
    assert.equal((await create({total:4400,region:'CL-VS',commune:'05101'})).amount,4400);
    await db.exec("update public.shipping_settings set quantity_discount_enabled=true,quantity_discount_min_units=2,quantity_discount_percent=50");
    assert.equal((await create({total:3200,region:'CL-VS',commune:'05101'})).amount,3200);
    await db.exec("update public.shipping_settings set calculation_mode='highest'");
    assert.equal((await create({total:2600,region:'CL-VS',commune:'05101'})).amount,2600);
    await db.exec("update public.shipping_settings set quantity_discount_enabled=false,calculation_mode='per_unit'; update public.shipping_rates set blue_l=0 where commune_code='05101'");
    assert.equal((await create({total:2000,region:'CL-VS',commune:'05101'})).amount,2000);
    await db.exec("update public.shipping_rates set blue_enabled=false where commune_code='05101'");
    await assert.rejects(create({total:2000,region:'CL-VS',commune:'05101'}),/coordinar/);
    await db.exec("update public.products set package_length_cm=71 where sku='A'");
    await assert.rejects(create({total:2000}),/70 cm/);
    await db.exec("update public.products set shipping_scope='rm' where sku='A'");
    assert.equal((await order(await create({total:2000,region:'CL-VS',commune:''}))).shipping_commune,'Retiro en taller');
    await db.exec("update public.products set shipping_scope=null,package_length_cm=10,package_width_cm=10,package_height_cm=10,package_weight_kg=20.001 where sku='A'");
    await assert.rejects(create({total:2000}),/20 kg/);
    await db.exec("update public.products set package_weight_kg=1 where sku='A'; update public.shipping_rates set blue_zone='pendiente',blue_enabled=true where commune_code='05101'");
    await assert.rejects(create({total:2000,region:'CL-VS',commune:'05101'}),/confirmación/);
    await db.exec("update public.shipping_rates set blue_zone='centro' where commune_code='05101'");
    await db.exec("update public.products set shipping_automatic=false where sku='A'; update public.shipping_rates set blue_enabled=true,blue_l=null where commune_code='05101'");
    assert.equal((await create()).amount,2250);
  });
  await t.test("Blue tariffs and origin remain admin-only", async () => {
    for (const [role,uid] of [["anon",""],["authenticated",customerId]]) {
      await setRole(role,uid);
      assert.equal((await db.query("select count(*) from public.blue_pyme_tariffs")).rows[0].count,3);
      if (role==='anon') await assert.rejects(db.exec("update public.blue_pyme_tariffs set s=0"),/permission denied/);
      else {
        assert.equal((await db.query("update public.blue_pyme_tariffs set s=0 returning *")).rows.length,0);
        assert.equal((await db.query("update public.shipping_settings set origin_commune_code=null returning *")).rows.length,0);
      }
      await assert.rejects(db.query("select public.blue_product_shipping_price(null,null)"),/permission denied/);
    }
    await setRole("authenticated",adminId);
    await assert.rejects(db.exec("update public.blue_pyme_tariffs set s=-1"),/check constraint/);
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
