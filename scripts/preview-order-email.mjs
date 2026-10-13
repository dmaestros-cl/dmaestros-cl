// Local visual preview only. Does not send mail or connect to a database.
import { createServer } from "node:http";
import { renderOrderEmail } from "../lib/order-email-template.ts";
const sample = {
  order_number: 99, customer_name: "Cliente de prueba", customer_email: "cliente@example.com", customer_phone: "+56912345678",
  shipping_address: "Dirección de ejemplo 123", shipping_region: "Metropolitana", shipping_commune: "Santiago", shipping_cost: 6990, total: 66980,
  created_at: "2026-10-13T19:00:00Z", items: [{ sku: "DM-J01", product_name: "Juego destapador de cerveza · Nogal", unit_price: 59990, quantity: 1 }],
  payment: { environment: "integration", authorization_code: "123456", payment_type_code: "VN", card_last_four: "6623", transaction_date: "2026-10-13T19:01:00Z", installments_number: 0 },
};
createServer((request, response) => {
  const audience = new URL(request.url, "http://localhost").searchParams.get("audience") === "admin" ? "admin" : "customer";
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(renderOrderEmail(sample, audience, "https://www.dmaestros.cl").html);
}).listen(3098, "127.0.0.1", () => console.log("Email preview: http://127.0.0.1:3098"));
