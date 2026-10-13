// Keep historical integration records for reconciliation, never as commercial sales.
export const COMMERCIAL_ORDERS_FILTER = "payment_environment.is.null,payment_environment.eq.production";

export function isCommercialOrder(order: { payment_environment?: string | null }) {
  return order.payment_environment == null || order.payment_environment === "production";
}
