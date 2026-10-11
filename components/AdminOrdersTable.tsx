"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Order = { id: string; order_number: number; customer_name: string; customer_email: string; created_at: string; status: string; shipping_status: string; total: number | string };

const shippingOptions = [
  ["por_preparar", "Pendiente"],
  ["preparado", "Preparando"],
  ["despachado", "Enviado"],
  ["entregado", "Recibido"],
  ["cancelado", "Cancelado"],
] as const;

function paymentState(status: string) {
  if (status === "cancelado") return "cancelado";
  return status === "pendiente" ? "pendiente" : "pagado";
}

export function AdminOrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function updatePayment(order: Order, value: string) {
    setBusyId(order.id); setMessage("");
    const nextStatus = value === "pagado" ? "pagado" : value;
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id);
    if (!error) setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item));
    setBusyId(null); setMessage(error ? error.message : `Estado de pago del pedido #${String(order.order_number).padStart(5, "0")} actualizado.`);
  }

  async function updateShipping(order: Order, value: string) {
    setBusyId(order.id); setMessage("");
    const statusMap: Record<string, string> = { por_preparar: "pendiente", preparado: "preparando", despachado: "enviado", entregado: "entregado", cancelado: "cancelado" };
    const payload = value === "cancelado" ? { status: "cancelado" } : { shipping_status: value, ...(statusMap[value] ? { status: statusMap[value] } : {}) };
    const { error } = await supabase.from("orders").update(payload).eq("id", order.id);
    if (!error) setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...payload, shipping_status: value } : item));
    setBusyId(null); setMessage(error ? error.message : `Estado de envío del pedido #${String(order.order_number).padStart(5, "0")} actualizado.`);
  }

  return <>{message && <p className="admin-table-message" role="status">{message}</p>}<div className="admin-table-wrap"><table className="admin-orders-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado del pago</th><th>Estado del envío</th><th>Total</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{String(order.order_number).padStart(5,"0")}</strong></td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td>{new Date(order.created_at).toLocaleDateString("es-CL")}</td><td><select className={`admin-order-select is-${paymentState(order.status)}`} value={paymentState(order.status)} disabled={busyId === order.id} onChange={(event) => updatePayment(order, event.target.value)} aria-label={`Estado del pago del pedido ${order.order_number}`}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="cancelado">Cancelado</option></select></td><td><select className={`admin-order-select is-${order.status === "cancelado" ? "cancelado" : order.shipping_status}`} value={order.status === "cancelado" ? "cancelado" : order.shipping_status} disabled={busyId === order.id} onChange={(event) => updateShipping(order, event.target.value)} aria-label={`Estado del envío del pedido ${order.order_number}`}>{shippingOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td><td><strong>${Number(order.total).toLocaleString("es-CL")}</strong></td></tr>)}</tbody></table></div></>;
}
