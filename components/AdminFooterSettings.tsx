"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminDeleteDialog } from "@/components/AdminDeleteDialog";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

export type FooterSettings = { business_name: string; location_text: string; contact_email: string; service_text: string; service_hours: string };
export type FooterLink = { id: string; section_key: string; label: string; href: string; sort_order: number; active: boolean };
export type FooterSection = { section_key: string; title: string; sort_order: number; active: boolean; links: FooterLink[] };

const emptyLink = (sectionKey: string): FooterLink => ({ id: "", section_key: sectionKey, label: "", href: "", sort_order: 10, active: true });

export function AdminFooterSettings({ initialSettings, initialSections }: { initialSettings: FooterSettings; initialSections: FooterSection[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState<FooterLink | null>(null);
  const [deleting, setDeleting] = useState<FooterLink | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function saveContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.from("footer_settings").upsert({ id: true, ...settings, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) setMessage(error.message);
    else setSuccess({ title: "Datos actualizados", message: "La información de contacto ya está publicada en el pie de página." });
  }

  async function saveSection(section: FooterSection) {
    setBusy(true); setMessage("");
    const { error } = await supabase.from("footer_sections").update({ title: section.title, active: section.active, sort_order: section.sort_order }).eq("section_key", section.section_key);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setSections((current) => [...current].sort((a, b) => a.sort_order - b.sort_order));
      setSuccess({ title: "Sección actualizada", message: `La columna “${section.title}” fue guardada correctamente.` });
    }
  }

  async function saveLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setMessage("");
    const payload = { section_key: editing.section_key, label: editing.label.trim(), href: editing.href.trim(), sort_order: editing.sort_order, active: editing.active };
    const query = editing.id ? supabase.from("footer_links").update(payload).eq("id", editing.id).select().single() : supabase.from("footer_links").insert(payload).select().single();
    const { data, error } = await query;
    if (!error && data) setSections((current) => current.map((section) => section.section_key === data.section_key ? { ...section, links: [...section.links.filter((link) => link.id !== data.id), data].sort((a, b) => a.sort_order - b.sort_order) } : section));
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setEditing(null);
      setSuccess({ title: "Enlace guardado", message: "El elemento del pie de página fue actualizado correctamente." });
    }
  }

  async function removeLink() {
    if (!deleting) return;
    const link = deleting;
    setBusy(true); const { error } = await supabase.from("footer_links").delete().eq("id", link.id);
    if (!error) setSections((current) => current.map((section) => ({ ...section, links: section.links.filter((item) => item.id !== link.id) })));
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setDeleting(null);
      setSuccess({ title: "Enlace eliminado", message: `“${link.label}” fue retirado completamente del pie de página.` });
    }
  }

  return <div className="admin-footer-settings">
    <form className="admin-panel-card admin-footer-contact" onSubmit={saveContact}>
      <header><div><span className="admin-eyebrow">Identidad y contacto</span><h2>Datos de DMaestros</h2><p>Información que aparece en la primera columna del pie de página.</p></div><span className="admin-footer-card-number">01</span></header>
      <div className="admin-footer-form-grid">
        <label>Nombre comercial<input value={settings.business_name} onChange={(event) => setSettings({ ...settings, business_name: event.target.value })} required /></label>
        <label>Correo de contacto<input type="email" value={settings.contact_email} onChange={(event) => setSettings({ ...settings, contact_email: event.target.value })} required /></label>
        <label className="is-wide">Ubicación o descripción<textarea rows={2} value={settings.location_text} onChange={(event) => setSettings({ ...settings, location_text: event.target.value })} required /></label>
        <label>Tipo de atención<input value={settings.service_text} onChange={(event) => setSettings({ ...settings, service_text: event.target.value })} required /></label>
        <label>Horario<input value={settings.service_hours} onChange={(event) => setSettings({ ...settings, service_hours: event.target.value })} required /></label>
      </div>
      <button className="admin-primary-button" disabled={busy}>Guardar datos de contacto</button>
    </form>

    <div className="admin-footer-section-heading"><div><span className="admin-eyebrow">Directorio</span><h2>Columnas y enlaces</h2><p>Edita cada bloque por separado, ordena sus enlaces y decide cuáles se publican.</p></div></div>
    <div className="admin-footer-groups">{sections.map((section, index) => <article className="admin-panel-card admin-footer-group" key={section.section_key}>
      <header><span className="admin-footer-card-number">{String(index + 2).padStart(2, "0")}</span><div className="admin-footer-section-fields"><label>Título de la columna<input value={section.title} onChange={(event) => setSections((current) => current.map((item) => item.section_key === section.section_key ? { ...item, title: event.target.value } : item))} /></label><label>Orden<input type="number" min="0" step="10" value={section.sort_order} onChange={(event) => setSections((current) => current.map((item) => item.section_key === section.section_key ? { ...item, sort_order: Number(event.target.value) } : item))} /></label></div><label className="admin-switch"><input type="checkbox" checked={section.active} onChange={(event) => setSections((current) => current.map((item) => item.section_key === section.section_key ? { ...item, active: event.target.checked } : item))} /><span /><small>{section.active ? "Visible" : "Oculta"}</small></label></header>
      <div className="admin-footer-link-list">{section.links.map((link) => <div className="admin-footer-link-row" key={link.id}><span className={link.active ? "is-live" : ""} aria-hidden="true" /><div><strong>{link.label}</strong><small>{link.href}</small></div><em>{link.sort_order}</em><button type="button" onClick={() => setEditing(link)} aria-label={`Editar ${link.label}`} title="Editar">✎</button><button type="button" className="is-danger" onClick={() => setDeleting(link)} aria-label={`Eliminar ${link.label}`} title="Eliminar">×</button></div>)}</div>
      <footer><button type="button" className="admin-secondary-button" onClick={() => setEditing({ ...emptyLink(section.section_key), sort_order: (section.links.at(-1)?.sort_order ?? 0) + 10 })}>+ Agregar enlace</button><button type="button" className="admin-primary-button" disabled={busy} onClick={() => saveSection(section)}>Guardar sección</button></footer>
    </article>)}</div>
    {message && <p className="admin-form-message" role="status">{message}</p>}

    {editing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}><form className="admin-modal admin-footer-link-modal" onSubmit={saveLink} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="admin-eyebrow">Pie de página</span><h2>{editing.id ? "Editar enlace" : "Nuevo enlace"}</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar">×</button></header><label>Texto visible<input value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} required /></label><label>Destino del enlace<input value={editing.href} onChange={(event) => setEditing({ ...editing, href: event.target.value })} placeholder="/tienda o https://..." required /></label><div className="admin-form-row"><label>Orden<input type="number" min="0" value={editing.sort_order} onChange={(event) => setEditing({ ...editing, sort_order: Number(event.target.value) })} /></label><label className="admin-switch"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /><span /><small>{editing.active ? "Visible" : "Oculto"}</small></label></div><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar enlace"}</button></form></div>}
    {deleting && <AdminDeleteDialog type="enlace" name={deleting.label} detail="Esta acción lo eliminará de la base de datos y dejará de aparecer inmediatamente en el sitio público." busy={busy} onCancel={() => setDeleting(null)} onConfirm={removeLink} />}
    {success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => setSuccess(null)} />}
  </div>;
}
