import { AdminEmpty, AdminPageHeader } from "@/components/AdminPageHeader";
import { requireAdmin } from "@/lib/admin";

export default async function OrdersPage() {
  const { supabase } = await requireAdmin();
  const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const rows = orders ?? [];
  return <>
    <AdminPageHeader eyebrow="Ventas" title="Pedidos" description="Revisa pagos, preparación y estado de despacho." />
    <section className="admin-stats"><article><span>Pedidos totales</span><strong>{rows.length}</strong></article><article><span>Pendientes</span><strong>{rows.filter((order) => order.status === "pendiente").length}</strong></article><article><span>En preparación</span><strong>{rows.filter((order) => order.status === "preparando").length}</strong></article></section>
    <section className="admin-panel-card">
      {error && <p className="admin-db-note">Configura la base de datos para comenzar a recibir pedidos.</p>}
      {rows.length === 0 ? <AdminEmpty title="Aún no hay pedidos" description="Los pedidos de la tienda aparecerán aquí con su estado y total." /> : <div className="admin-table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>{rows.map((order) => <tr key={order.id}><td>#{String(order.order_number).padStart(5,"0")}</td><td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td><td>{new Date(order.created_at).toLocaleDateString("es-CL")}</td><td><span className={`admin-status is-${order.status}`}>{order.status}</span></td><td>${Number(order.total).toLocaleString("es-CL")}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
