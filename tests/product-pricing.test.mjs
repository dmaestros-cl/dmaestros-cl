import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { validateProductPricing } from "../lib/product-pricing.ts";

const componentSource = readFileSync(new URL("../components/ProductCardPrice.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(componentSource, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
});
const componentModule = { exports: {} };
runInNewContext(outputText, { exports: componentModule.exports, require: createRequire(import.meta.url) });
const renderPrice = (product) => renderToStaticMarkup(createElement(componentModule.exports.ProductCardPrice, { product }));

test("online purchase requires a normal price when creating, editing or enabling it", () => {
  for (const price of [null, 0, -1, NaN, Infinity, 100.5]) {
    assert.match(validateProductPricing({ sale_mode: "buy", price, sale_price: null }), /precio normal/);
  }
  assert.equal(validateProductPricing({ sale_mode: "buy", price: 89740, sale_price: null }), null);
});

test("an optional offer must be a positive CLP amount below the normal price", () => {
  assert.equal(validateProductPricing({ sale_mode: "buy", price: 69990, sale_price: 59990 }), null);
  for (const sale_price of [0, -1, NaN, Infinity, 59990.5, 69990, 79990]) {
    assert.match(validateProductPricing({ sale_mode: "buy", price: 69990, sale_price }), /precio oferta/);
  }
});

test("quote mode can keep its prices empty or store prices for later purchase activation", () => {
  assert.equal(validateProductPricing({ sale_mode: "quote", price: null, sale_price: null }), null);
  assert.equal(validateProductPricing({ sale_mode: "quote", price: 69990, sale_price: 59990 }), null);
  assert.match(validateProductPricing({ sale_mode: "quote", price: null, sale_price: 59990 }), /precio oferta/);
});

test("store and featured price component displays normal and offer prices even without stock", () => {
  const product = { saleMode: "buy", price: 69990, salePrice: 59990 };
  const html = renderPrice({ ...product, stock: 0, available: false });
  assert.match(html, /<del>\$69\.990<\/del>/);
  assert.match(html, /<strong>\$59\.990<\/strong>/);
  assert.equal(html, renderPrice({ ...product, stock: 5, available: true }));
});

test("products without an offer display their configured normal price", () => {
  for (const price of [89740, 84780]) {
    const html = renderPrice({ saleMode: "buy", price, stock: 0, available: false });
    assert.ok(html.includes(`$${price.toLocaleString("es-CL")}`));
    assert.doesNotMatch(html, /<del>/);
  }
});

test("quote products never expose normal or offer prices in their cards", () => {
  assert.equal(renderPrice({ saleMode: "quote", price: 69990, salePrice: 59990, stock: 1 }), "");
});
