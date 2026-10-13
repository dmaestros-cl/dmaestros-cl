import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseCheckoutInput, parseWebpayReturn, matchesPayment, isApproved } from "../lib/webpay-contract.ts";

const valid = () => ({ attemptId: randomUUID(), customer: { name: "Cliente prueba", email: "PRUEBA@example.com", phone: "+56912345678", address: "Dirección de prueba 123" }, items: [{ sku: "A", quantity: 2 }], regionCode: "CL-RM", communeCode: "13101", expectedTotal: 2250 });
test("checkout normalizes inputs and ignores browser-supplied prices", () => {
  const input = valid(); input.items[0].unitPrice = 1;
  const result = parseCheckoutInput(input);
  assert.equal(result.customer.email, "prueba@example.com");
  assert.deepEqual(result.items, [{ sku: "A", quantity: 2 }]);
});
for (const quantity of [-1, 0, 1.5, 100, "2"]) test(`rejects quantity ${quantity}`, () => { const input = valid(); input.items[0].quantity = quantity; assert.throws(() => parseCheckoutInput(input)); });
test("rejects duplicate SKUs, missing customer, invalid email and zero total", () => {
  const duplicate = valid(); duplicate.items.push({ sku: "A", quantity: 1 }); assert.throws(() => parseCheckoutInput(duplicate));
  assert.throws(() => parseCheckoutInput({ ...valid(), customer: null }));
  const invalidEmail = valid(); invalidEmail.customer.email = "wrong"; assert.throws(() => parseCheckoutInput(invalidEmail));
  assert.throws(() => parseCheckoutInput({ ...valid(), expectedTotal: 0 }));
});
const token = "a".repeat(64);
test("handles normal, cancelled, timeout and combined error callbacks", () => {
  assert.equal(parseWebpayReturn(new URLSearchParams({ token_ws: token })).event, "commit");
  const aborted = { TBK_TOKEN: token, TBK_ORDEN_COMPRA: "DM-1", TBK_ID_SESION: "session" };
  assert.equal(parseWebpayReturn(new URLSearchParams(aborted)).event, "cancel");
  assert.equal(parseWebpayReturn(new URLSearchParams({ TBK_ORDEN_COMPRA: "DM-1", TBK_ID_SESION: "session" })).event, "timeout");
  assert.equal(parseWebpayReturn(new URLSearchParams({ ...aborted, token_ws: token })).event, "error");
});
test("rejects invalid, conflicting and duplicate callback tokens", () => {
  assert.throws(() => parseWebpayReturn(new URLSearchParams()));
  assert.throws(() => parseWebpayReturn(new URLSearchParams({ token_ws: "bad" })));
  assert.throws(() => parseWebpayReturn(new URLSearchParams(`token_ws=${token}&token_ws=${token}`)));
  assert.throws(() => parseWebpayReturn(new URLSearchParams({ token_ws: token, TBK_TOKEN: "b".repeat(64), TBK_ORDEN_COMPRA: "DM-1", TBK_ID_SESION: "session" })));
});
test("approval requires exact response code AND status, with matching order, session, amount", () => {
  const result = { amount: 2250, buy_order: "DM-1", session_id: "session", status: "AUTHORIZED", response_code: 0 };
  assert.equal(isApproved(result), true);
  assert.equal(isApproved({ ...result, response_code: "0" }), false);
  assert.equal(isApproved({ ...result, status: "INITIALIZED" }), false);
  assert.equal(matchesPayment(result, result), true);
  for (const changes of [{ amount: 1 }, { amount: "2250" }, { buy_order: "other" }, { session_id: "other" }]) assert.equal(matchesPayment({ ...result, ...changes }, result), false);
});
