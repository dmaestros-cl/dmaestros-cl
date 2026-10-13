export const WEBPAY_PRODUCTION_COMMERCE_CODE = "597053098347";
export const WEBPAY_TOKEN = /^[a-zA-Z0-9]{64}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CheckoutInput = {
  attemptId: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: { sku: string; quantity: number }[];
  regionCode: string;
  communeCode: string;
  expectedTotal: number;
};

export class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CheckoutError("Solicitud inválida.");
  return value as Record<string, unknown>;
}

function text(value: unknown, min: number, max: number) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new CheckoutError("Revisa los datos de contacto y despacho.");
  }
  return value.trim();
}

export function parseCheckoutInput(value: unknown): CheckoutInput {
  const input = record(value);
  const customer = record(input.customer);
  const attemptId = text(input.attemptId, 36, 36);
  if (!UUID.test(attemptId)) throw new CheckoutError("Identificador de compra inválido.");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new CheckoutError("Revisa los productos del carrito.");
  const skus = new Set<string>();
  const items = input.items.map((value) => {
    const line = record(value);
    const sku = text(line.sku, 1, 80);
    if (skus.has(sku) || !Number.isInteger(line.quantity) || Number(line.quantity) < 1 || Number(line.quantity) > 99) {
      throw new CheckoutError("Las cantidades del carrito no son válidas.");
    }
    skus.add(sku);
    return { sku, quantity: Number(line.quantity) };
  }).sort((a, b) => a.sku.localeCompare(b.sku));
  const email = text(customer.email, 3, 254).toLowerCase();
  const phone = text(customer.phone, 8, 30);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?[\d\s()-]{8,30}$/.test(phone)) throw new CheckoutError("Revisa el correo y el teléfono.");
  if (!Number.isSafeInteger(input.expectedTotal) || Number(input.expectedTotal) <= 0) throw new CheckoutError("El total de la compra no es válido.");
  return {
    attemptId,
    customer: { name: text(customer.name, 2, 150), email, phone, address: text(customer.address, 0, 500) },
    items,
    regionCode: text(input.regionCode, 1, 20),
    communeCode: text(input.communeCode, 0, 20),
    expectedTotal: Number(input.expectedTotal),
  };
}

export type WebpayResult = {
  amount: number;
  buy_order: string;
  session_id: string;
  status: string;
  response_code?: number;
  authorization_code?: string;
  payment_type_code?: string;
  installments_number?: number;
  transaction_date?: string;
  card_detail?: { card_number?: string };
};

export function matchesPayment(result: WebpayResult, payment: { amount: number | string; buy_order: string; session_id: string }) {
  return typeof result.amount === "number" && Number.isSafeInteger(result.amount) && result.amount === Number(payment.amount)
    && result.buy_order === payment.buy_order && result.session_id === payment.session_id;
}

export function isApproved(result: WebpayResult) {
  return result.status === "AUTHORIZED" && result.response_code === 0;
}

export type ReturnEvent = "commit" | "cancel" | "timeout" | "error";
export function parseWebpayReturn(params: URLSearchParams) {
  const token = params.get("token_ws");
  const cancelledToken = params.get("TBK_TOKEN");
  const buyOrder = params.get("TBK_ORDEN_COMPRA");
  const sessionId = params.get("TBK_ID_SESION");
  for (const name of ["token_ws", "TBK_TOKEN", "TBK_ORDEN_COMPRA", "TBK_ID_SESION"]) {
    if (params.getAll(name).length > 1) throw new CheckoutError("Retorno de pago inválido.");
  }
  if ((token && !WEBPAY_TOKEN.test(token)) || (cancelledToken && !WEBPAY_TOKEN.test(cancelledToken))) throw new CheckoutError("Token de pago inválido.");
  if (token && !cancelledToken && !buyOrder && !sessionId) return { event: "commit" as ReturnEvent, token, buyOrder: null, sessionId: null };
  if (buyOrder && buyOrder.length <= 26 && sessionId && sessionId.length <= 61) {
    if (token && cancelledToken && token !== cancelledToken) throw new CheckoutError("Retorno de pago inválido.");
    return { event: (token ? "error" : cancelledToken ? "cancel" : "timeout") as ReturnEvent, token: cancelledToken, buyOrder, sessionId };
  }
  throw new CheckoutError("No se recibió una transacción válida de Webpay.");
}
