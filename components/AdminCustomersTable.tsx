"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminDeleteDialog } from "@/components/AdminDeleteDialog";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

export type AdminCustomerRow = { id: string; first_name: string; last_name: string; email: string; phone: string; address: string; created_at: string };

function Icon({ name }: { name: "view" | "edit" | "delete" }) {
  if (name === "view") return <svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if (name === "edit") return <svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>;
}

export function AdminCustomersTable({ initialRows }: { initialRows: AdminCustomerRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [viewing, setViewing] = useState<AdminCustomerRow | null>(null);
  const [editing, setEditing] = useState<AdminCustomerRow | null>(null);
  const [deleting, setDeleting] = useState<AdminCustomerRow | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const changes = { first_name: String(form.get("first_name")).trim(), last_name: String(form.get("last_name")).trim(), phone: String(form.get("phone")).trim(), address: String(form.get("address")).trim(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("customer_profiles").update(changes).eq("id", editing.id);
    setBusy(false); if (error) return setMessage(error.message);
    setRows((current) => current.map((row) => row.id === editing.id ? { ...row, ...changes } : row)); setEditing(null); setSuccess({ title: "Cliente actualizado", message: "Los datos del cliente se guardaron correctamente." });
  }

  async function remove() {
    if (!deleting) return; setBusy(true); setMessage("");
    const { error } = await supabase.rpc("admin_delete_customer", { customer_id: deleting.id });
    setBusy(false); if (error) return setMessage(error.message);
    setRows((current) => current.filter((row) => row.id !== deleting.id)); setDeleting(null); setSuccess({ title: "Cliente eliminado", message: "La cuenta y su perfil fueron eliminados completamente." });
  }

  return <><section className="admin-panel-card"><div className="admin-table-wrap"><table className="admin-customers-table"><thead><tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Registro</th><th className="admin-actions-heading">Acciones</th></tr></thead><tbody>{rows.map((customer) => <tr key={customer.id}><td><strong>{customer.first_name} {customer.last_name}</strong><small>{customer.address}</small></td><td>{customer.email}</td><td>{customer.phone || "—"}</td><td>{new Date(customer.created_at).toLocaleDateString("es-CL")}</td><td><div className="admin-product-actions"><button type="button" title="Ver cliente" aria-label={`Ver ${customer.first_name}`} onClick={() => setViewing(customer)}><Icon name="view" /></button><button type="button" title="Editar cliente" aria-label={`Editar ${customer.first_name}`} onClick={() => setEditing(customer)}><Icon name="edit" /></button><button type="button" className="is-danger" title="Eliminar cliente" aria-label={`Eliminar ${customer.first_name}`} onClick={() => setDeleting(customer)}><Icon name="delete" /></button></div></td></tr>)}</tbody></table></div>{!rows.length && <div className="admin-empty"><h2>No hay clientes registrados</h2></div>}</section>{message && <p className="admin-table-message">{message}</p>}
  {viewing && <div className="admin-modal-backdrop" onMouseDown={() => setViewing(null)}><section className="admin-modal admin-customer-view" onMouseDown={(event) => event.stopPropagation()}><header><div><span className="admin-eyebrow">Ficha del cliente</span><h2>{viewing.first_name} {viewing.last_name}</h2></div><button onClick={() => setViewing(null)} aria-label="Cerrar">×</button></header><dl><div><dt>Correo</dt><dd>{viewing.email}</dd></div><div><dt>Teléfono</dt><dd>{viewing.phone || "Sin teléfono"}</dd></div><div><dt>Dirección</dt><dd>{viewing.address || "Sin dirección"}</dd></div><div><dt>Registro</dt><dd>{new Date(viewing.created_at).toLocaleDateString("es-CL")}</dd></div></dl></section></div>}
  {editing && <div className="admin-modal-backdrop" onMouseDown={() => setEditing(null)}><form className="admin-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="admin-eyebrow">Editar cliente</span><h2>{editing.first_name} {editing.last_name}</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar">×</button></header><div className="admin-form-row"><label>Nombre<input name="first_name" defaultValue={editing.first_name} required /></label><label>Apellidos<input name="last_name" defaultValue={editing.last_name} required /></label></div><label>Teléfono<input name="phone" defaultValue={editing.phone} /></label><label>Dirección<input name="address" defaultValue={editing.address} /></label><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button></form></div>}
  {deleting && <AdminDeleteDialog type="cliente" name={`${deleting.first_name} ${deleting.last_name}`} detail="Se eliminarán permanentemente su acceso y perfil. Los pedidos históricos se conservarán como registro comercial." busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />}{success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => setSuccess(null)} />}</>;
}
