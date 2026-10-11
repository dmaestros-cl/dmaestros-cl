import { AdminEmpty, AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminOrdersTable } from "@/components/AdminOrdersTable";
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
      {rows.length === 0 ? <AdminEmpty title="Aún no hay pedidos" description="Los pedidos de la tienda aparecerán aquí con su estado y total." /> : <AdminOrdersTable initialOrders={rows} />}
    </section>
  </>;
}
