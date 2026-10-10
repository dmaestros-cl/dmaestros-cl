import { AdminEmpty, AdminPageHeader } from "@/components/AdminPageHeader";
import { requireAdmin } from "@/lib/admin";

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();
  const { data: methods } = await supabase.from("shipping_methods").select("*").order("created_at");
  const rows = methods ?? [];
  return <>
    <AdminPageHeader eyebrow="Logística" title="Envíos" description="Configura coberturas, costos y tiempos estimados." action={<button className="admin-primary-button">＋ Método de envío</button>} />
    <section className="admin-shipping-grid">{rows.map((method) => <article key={method.id}><header><span>⌁</span><b className={method.active ? "is-on" : ""}>{method.active ? "Activo" : "Inactivo"}</b></header><h2>{method.name}</h2><p>{method.regions}</p><dl><div><dt>Costo</dt><dd>{Number(method.price) === 0 ? "A coordinar" : `$${Number(method.price).toLocaleString("es-CL")}`}</dd></div><div><dt>Plazo</dt><dd>{method.estimated_days}</dd></div></dl></article>)}</section>
    {rows.length === 0 && <section className="admin-panel-card"><AdminEmpty title="Sin métodos de envío" description="Agrega retiro en taller o despacho a regiones." /></section>}
  </>;
}
