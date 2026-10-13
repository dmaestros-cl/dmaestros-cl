import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminOrdersTable } from "@/components/AdminOrdersTable";
import { requireAdmin } from "@/lib/admin";

export default async function OrdersPage() {
  const { supabase } = await requireAdmin();
  const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const rows = orders ?? [];
  return <>
    <AdminPageHeader eyebrow="Ventas" title="Pedidos" description="Revisa pagos, preparación y estado de despacho." />
    {error ? <p className="admin-db-note" role="alert">No pudimos cargar los pedidos. Actualiza la página e intenta nuevamente.</p> : <AdminOrdersTable initialOrders={rows} />}
  </>;
}
