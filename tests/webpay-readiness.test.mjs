import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isCommercialOrder, COMMERCIAL_ORDERS_FILTER } from "../lib/commerce-policy.ts";
import { readWebpaySettings } from "../lib/webpay-settings.ts";

const config = {
  WEBPAY_ENVIRONMENT: "production", WEBPAY_COMMERCE_CODE: "597053098347",
  WEBPAY_API_KEY_SECRET: "fixture-private-key-not-used-for-network", SITE_URL: "https://www.dmaestros.cl", VERCEL_ENV: "production",
};

test("production configuration selects live host without editing UI or templates", () => {
  const live = readWebpaySettings(config, true);
  assert.equal(live.origin, "https://webpay3g.transbank.cl");
  assert.equal(live.commerceCode, "597053098347");
  assert.equal(live.siteOrigin, "https://www.dmaestros.cl");
});

test("public checkout fails closed for absent, sandbox, mixed or preview credentials", () => {
  for (const overrides of [
    { WEBPAY_API_KEY_SECRET: "" }, { SITE_URL: "" }, { WEBPAY_ENVIRONMENT: "" },
    { WEBPAY_ENVIRONMENT: "integration", WEBPAY_COMMERCE_CODE: "597055555532", WEBPAY_ALLOW_TEST_ON_PRODUCTION: "true" },
    { WEBPAY_COMMERCE_CODE: "597055555532" }, { VERCEL_ENV: "preview" },
    { WEBPAY_API_KEY_SECRET: "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C" },
    { SITE_URL: "http://www.dmaestros.cl" }, { SITE_URL: "https://www.dmaestros.cl/checkout" },
  ]) assert.throws(() => readWebpaySettings({ ...config, ...overrides }, true));
});

test("historical integration callbacks can still reconcile without reopening checkout", () => {
  const integration = { ...config, WEBPAY_ENVIRONMENT: "integration", WEBPAY_COMMERCE_CODE: "597055555532", WEBPAY_ALLOW_TEST_ON_PRODUCTION: "true" };
  assert.equal(readWebpaySettings(integration).origin, "https://webpay3gint.transbank.cl");
  assert.throws(() => readWebpaySettings(integration, true));
});

test("commercial order listings retain manual and live orders but exclude certification", () => {
  assert.equal(COMMERCIAL_ORDERS_FILTER, "payment_environment.is.null,payment_environment.eq.production");
  const rows = [{ id: 1 }, { id: 2, payment_environment: null }, { id: 3, payment_environment: "production" }, { id: 4, payment_environment: "integration" }];
  assert.deepEqual(rows.filter(isCommercialOrder).map(({ id }) => id), [1, 2, 3]);
});

test("payment creation and notifications enforce readiness before side effects", async () => {
  const route = await readFile(new URL("../app/api/payments/webpay/route.ts", import.meta.url), "utf8");
  assert.ok(route.indexOf("getCheckoutWebpayConfig();") < route.indexOf("createPaymentClient();"));
  const notifications = await readFile(new URL("../lib/order-notifications.ts", import.meta.url), "utf8");
  assert.ok(notifications.indexOf('.eq("payment_environment", "production")') < notifications.indexOf('db.rpc("claim_order_email"'));
});
