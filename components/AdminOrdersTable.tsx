"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminEditOrderDialog, AdminRemoveOrderDialog } from "@/components/AdminOrderDialog";
import { orderNumber, type AdminOrder as Order } from "@/lib/admin-orders";

const shippingOptions = [
  ["por_preparar", "Pendiente"],
  ["preparado", "Preparando"],
  ["despachado", "Enviado"],
  ["entregado", "Recibido"],
  ["cancelado", "Cancelado"],
] as const;

function paymentState(order: Order) {
  if (order.payment_provider === "webpay_plus") {
    if (order.payment_status === "authorized") return "pagado";
    return ["failed", "cancelled", "expired"].includes(order.payment_status ?? "") ? "cancelado" : "pendiente";
  }
  const status = order.status;
  if (status === "cancelado") return "cancelado";
  return status === "pendiente" ? "pendiente" : "pagado";
}

export function AdminOrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function updatePayment(order: Order, value: string) {
    if (order.payment_provider === "webpay_plus") return;
    setBusyId(order.id); setMessage("");
    const nextStatus = value === "pagado" ? "pagado" : value;
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id);
    if (!error) setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item));
    setBusyId(null); setMessage(error ? error.message : `Estado de pago del pedido #${String(order.order_number).padStart(5, "0")} actualizado.`);
  }

  async function updateShipping(order: Order, value: string) {
    setBusyId(order.id); setMessage("");
    const statusMap: Record<string, string> = { por_preparar: "pendiente", preparado: "preparando", despachado: "enviado", entregado: "entregado", cancelado: "cancelado" };
    const payload = value === "cancelado" ? { status: "cancelado" } : { shipping_status: value, ...(order.payment_provider === "webpay_plus" && value === "por_preparar" ? { status: order.payment_status === "authorized" ? "pagado" : "pendiente" } : statusMap[value] ? { status: statusMap[value] } : {}) };
    const { error } = await supabase.from("orders").update(payload).eq("id", order.id);
    if (!error) setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...payload, shipping_status: value } : item));
    setBusyId(null); setMessage(error ? error.message : `Estado de envío del pedido #${String(order.order_number).padStart(5, "0")} actualizado.`);
  }

  return <>
    <section className="admin-stats" aria-label="Resumen de pedidos">
      <article><span>Pedidos totales</span><strong>{orders.length}</strong></article>
      <article><span>Pendientes</span><strong>{orders.filter((order) => order.status === "pendiente").length}</strong></article>
      <article><span>En preparación</span><strong>{orders.filter((order) => order.status === "preparando").length}</strong></article>
    </section>
    {message && <p className="admin-table-message" role="status">{message}</p>}
    <section className="admin-panel-card">
      {orders.length ? <div className="admin-table-wrap"><table className="admin-orders-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado del pago</th><th>Estado del envío</th><th>Total</th><th className="admin-order-actions-cell">Acciones</th></tr></thead>
        <tbody>{orders.map((order) => <tr key={order.id}>
          <td><strong>#{orderNumber(order)}</strong></td>
          <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
          <td>{new Date(order.created_at).toLocaleDateString("es-CL")}</td>
          <td><select className={`admin-order-select is-${paymentState(order)}`} value={paymentState(order)} disabled={Boolean(busyId) || order.payment_provider === "webpay_plus"} onChange={(event) => updatePayment(order, event.target.value)} aria-label={`Estado del pago del pedido ${order.order_number}`}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="cancelado">Cancelado</option></select>{order.payment_provider === "webpay_plus" && <small>{order.payment_environment === "integration" ? "PRUEBA · Sin cobro ni despacho" : "Webpay Plus · Automático"}</small>}</td>
          <td><select className={`admin-order-select is-${order.status === "cancelado" ? "cancelado" : order.shipping_status}`} value={order.status === "cancelado" ? "cancelado" : order.shipping_status} disabled={Boolean(busyId) || (order.payment_provider === "webpay_plus" && (order.payment_status !== "authorized" || order.payment_environment === "integration"))} onChange={(event) => updateShipping(order, event.target.value)} aria-label={`Estado del envío del pedido ${order.order_number}`}>{shippingOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
          <td><strong>${Number(order.total).toLocaleString("es-CL")}</strong></td>
          <td className="admin-order-actions-cell"><div className="admin-product-actions">
            <button type="button" title="Editar contacto y envío" aria-label={`Editar pedido ${orderNumber(order)}`} disabled={Boolean(busyId)} onClick={() => setEditing(order)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg></button>
            <button type="button" className="is-danger" title="Eliminar pedido" aria-label={`Eliminar pedido ${orderNumber(order)}`} disabled={Boolean(busyId)} onClick={() => setDeleting(order)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg></button>
          </div></td>
        </tr>)}</tbody>
      </table></div> : <div className="admin-empty"><h2>Aún no hay pedidos</h2><p>Los pedidos de la tienda aparecerán aquí con su estado y total.</p></div>}
    </section>
    {editing && <AdminEditOrderDialog order={editing} onClose={() => setEditing(null)} onSaved={(saved) => {
      setOrders((current) => current.map((order) => order.id === saved.id ? saved : order)); setEditing(null);
      setMessage(`Contacto y envío del pedido #${orderNumber(saved)} actualizados.`); router.refresh();
    }} />}
    {deleting && <AdminRemoveOrderDialog order={deleting} onClose={() => setDeleting(null)} onDeleted={(id) => {
      setOrders((current) => current.filter((order) => order.id !== id)); setDeleting(null);
      setMessage(`Pedido #${orderNumber(deleting)} y sus registros relacionados eliminados definitivamente.`); router.refresh();
    }} />}
  </>;
}
