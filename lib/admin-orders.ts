export type OrderContact = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_region: string;
  shipping_commune: string;
};

export type AdminOrder = OrderContact & {
  id: string;
  order_number: number;
  created_at: string;
  status: string;
  shipping_status: string;
  total: number | string;
  shipping_cost: number | string;
  details_version: number;
  payment_provider?: string;
  payment_status?: string | null;
  payment_environment?: string | null;
};

export const orderNumber = (order: Pick<AdminOrder, "order_number">) => String(order.order_number).padStart(5, "0");

export function orderActionError(error: { message: string }) {
  const marker = "ORDER:";
  return error.message.startsWith(marker)
    ? error.message.slice(marker.length)
    : "No se pudo completar la operación. Revisa tu sesión de administrador e intenta nuevamente.";
}
