import test from "node:test";
import assert from "node:assert/strict";
import { renderOrderEmail } from "../lib/order-email-template.ts";

const order = {
  order_number: 99, customer_name: "Cliente Ejemplo", customer_email: "cliente@example.com", customer_phone: "+56912345678",
  shipping_address: "Dirección de ejemplo 123", shipping_region: "Metropolitana", shipping_commune: "Santiago", shipping_cost: 6990, total: 66980,
  created_at: "2026-10-13T19:00:00Z", items: [{ sku: "DM-01", product_name: "Juego artesanal de madera", unit_price: 59990, quantity: 1 }],
  payment: { environment: "production", authorization_code: "123456", payment_type_code: "VN", card_last_four: "6623", transaction_date: "2026-10-13T19:01:00Z", installments_number: 0 },
};

test("customer confirmation contains logo, contact, delivery, lines and payment without sandbox wording", () => {
  const email = renderOrderEmail(order, "customer", "https://www.dmaestros.cl");
  assert.match(email.subject, /^Confirmación de tu pedido #00099/);
  assert.doesNotMatch(email.html + email.text + email.subject, /prueba|simulado|sandbox|certificación/i);
  for (const value of ["logo-dmaestros.png", "Cliente Ejemplo", "cliente@example.com", "+56912345678", "Dirección de ejemplo 123", "DM-01", "59.990", "6.990", "66.980", "123456", "6623", "/cuenta"]) assert.ok(email.html.includes(value), value);
  assert.match(email.text, /Total pagado/);
  assert.doesNotMatch(email.html, /4051885600446623|CVV|token_ws|admin\/pedidos/);
});

test("admin receives separate wording and the authenticated admin link", () => {
  const email = renderOrderEmail(order, "admin", "https://www.dmaestros.cl");
  assert.match(email.subject, /Nuevo pedido pagado/);
  assert.match(email.html, /Nuevo pedido confirmado/);
  assert.match(email.html, /\/admin\/pedidos/);
  assert.doesNotMatch(email.html + email.text + email.subject, /prueba|simulado|sandbox|certificación/i);
});

test("integration and unknown environments cannot issue real purchase emails", () => {
  for (const environment of ["integration", "", undefined, "preview"]) {
    for (const audience of ["customer", "admin"]) {
      assert.throws(() => renderOrderEmail({ ...order, payment: { ...order.payment, environment } }, audience, "https://www.dmaestros.cl"), /Non-commercial/);
    }
  }
});

test("production and pickup wording do not claim a test or promise a dispatch", () => {
  const email = renderOrderEmail({ ...order, shipping_cost: 0, shipping_commune: "Retiro en taller", payment: { ...order.payment, environment: "production", installments_number: 3 } }, "customer", "https://www.dmaestros.cl");
  assert.doesNotMatch(email.subject, /PRUEBA/);
  assert.match(email.html, /Total pagado/);
  assert.match(email.text, /Retiro en taller/);
  assert.match(email.text, /Cuotas: 3/);
});

test("untrusted order values are escaped in HTML; unsafe link origins are refused", () => {
  const email = renderOrderEmail({ ...order, customer_name: '<img src=x onerror="alert(1)">', shipping_address: 'A & B <script>test</script>' }, "customer", "https://www.dmaestros.cl");
  assert.doesNotMatch(email.html, /<script>|<img src=x/);
  assert.match(email.html, /&lt;img/);
  assert.match(email.html, /A &amp; B/);
  assert.throws(() => renderOrderEmail(order, "customer", "javascript:alert(1)"));
});
