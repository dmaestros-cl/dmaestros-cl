"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { orderActionError, orderNumber, type AdminOrder, type OrderContact } from "@/lib/admin-orders";

function OrderDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialogRef} className="admin-order-dialog" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><h2 id={titleId}>{title}</h2><button type="button" className="admin-order-close" aria-label="Cerrar ventana" disabled={busy} onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></header>
    {children}
  </dialog>;
}

export function AdminEditOrderDialog({ order, onClose, onSaved }: { order: AdminOrder; onClose: () => void; onSaved: (order: AdminOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const details: OrderContact = {
      customer_name: String(form.get("customer_name") ?? "").trim(),
      customer_email: String(form.get("customer_email") ?? "").trim(),
      customer_phone: String(form.get("customer_phone") ?? "").trim(),
      shipping_address: String(form.get("shipping_address") ?? "").trim(),
      shipping_region: String(form.get("shipping_region") ?? "").trim(),
      shipping_commune: String(form.get("shipping_commune") ?? "").trim(),
    };
    try {
      const { data, error: saveError } = await createClient().rpc("admin_update_order_details", {
        p_order_id: order.id, p_expected_version: order.details_version, p_details: details,
      });
      if (saveError) return setError(orderActionError(saveError));
      if (!data?.id || data.id !== order.id) throw new Error("Invalid response");
      onSaved(data as AdminOrder);
    } catch { setError("No pudimos guardar. Revisa la conexión y vuelve a intentarlo."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <OrderDialog title={`Editar pedido #${orderNumber(order)}`} busy={busy} onClose={onClose}>
    <p className="admin-order-help">Actualiza el contacto y el destino de este pedido. La cuenta del cliente no se modifica.</p>
    <form onSubmit={save} className="admin-order-form">
      <fieldset disabled={busy}><legend>Contacto del cliente</legend>
        <label>Nombre completo<input name="customer_name" defaultValue={order.customer_name} minLength={2} maxLength={150} required autoComplete="off" autoFocus /></label>
        <div className="admin-form-row"><label>Correo electrónico<input name="customer_email" type="email" defaultValue={order.customer_email} maxLength={254} required autoComplete="off" /></label><label>Teléfono<input name="customer_phone" type="tel" defaultValue={order.customer_phone} maxLength={30} autoComplete="off" /></label></div>
      </fieldset>
      <fieldset disabled={busy}><legend>Datos de envío</legend>
        <div className="admin-form-row"><label>Región<input name="shipping_region" defaultValue={order.shipping_region} maxLength={120} /></label><label>Comuna o retiro en taller<input name="shipping_commune" defaultValue={order.shipping_commune} maxLength={120} /></label></div>
        <label>Dirección e indicaciones<textarea name="shipping_address" defaultValue={order.shipping_address} maxLength={500} rows={3} /></label>
      </fieldset>
      <p className="admin-order-notice">El total (${Number(order.total).toLocaleString("es-CL")}) y el despacho (${Number(order.shipping_cost).toLocaleString("es-CL")}) no cambian. Si cambias el destino, coordina cualquier diferencia de envío por separado.</p>
      {error && <p className="admin-order-error" role="alert">{error}</p>}
      <footer><button type="button" className="admin-secondary-button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button></footer>
    </form>
  </OrderDialog>;
}

export function AdminRemoveOrderDialog({ order, onClose, onDeleted }: { order: AdminOrder; onClose: () => void; onDeleted: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const confirmed = confirmation.trim().replace(/^#/, "") === orderNumber(order);
  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!confirmed || submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const { data, error: deleteError } = await createClient().rpc("admin_delete_order", { p_order_id: order.id, p_order_number: order.order_number });
      if (deleteError) return setError(orderActionError(deleteError));
      if (!data?.deleted || data.id !== order.id) throw new Error("Invalid response");
      onDeleted(order.id);
    } catch { setError("No pudimos confirmar la eliminación. Actualiza la lista antes de reintentar."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <OrderDialog title={`Eliminar pedido #${orderNumber(order)}`} busy={busy} onClose={onClose}>
    <p className="admin-order-help">Se eliminará definitivamente el pedido de <strong>{order.customer_name}</strong>, incluidos sus datos de contacto y envío, productos del pedido y registro Webpay de esta tienda.</p>
    <p className="admin-order-notice is-danger">Esta acción no se puede deshacer. No anula ni devuelve pagos en Transbank. La cuenta del cliente, el catálogo y los registros externos o respaldos no se eliminan.</p>
    <form className="admin-order-form" onSubmit={remove}>
      <label>Escribe {orderNumber(order)} para confirmar<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" inputMode="numeric" autoFocus /></label>
      {error && <p className="admin-order-error" role="alert">{error}</p>}
      <footer><button type="button" className="admin-secondary-button" onClick={onClose} disabled={busy}>Conservar pedido</button><button type="submit" className="admin-danger-button" disabled={busy || !confirmed}>{busy ? "Eliminando…" : "Eliminar definitivamente"}</button></footer>
    </form>
  </OrderDialog>;
}
