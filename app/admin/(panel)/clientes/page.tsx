import { AdminCustomersTable, type AdminCustomerRow } from "@/components/AdminCustomersTable";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { requireAdmin } from "@/lib/admin";

export default async function CustomersPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("customer_profiles").select("id,first_name,last_name,email,phone,address,created_at").order("created_at", { ascending: false });
  return <><AdminPageHeader eyebrow="Personas" title="Clientes" description="Consulta y administra las cuentas registradas en la tienda." />{error ? <div className="admin-alert">No fue posible cargar los clientes.</div> : <AdminCustomersTable initialRows={(data ?? []) as AdminCustomerRow[]} />}</>;
}
