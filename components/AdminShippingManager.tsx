"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ShippingRegion = { code: string; name: string; sort_order: number };
export type ShippingRate = { commune_code: string; region_code: string; commune_name: string; price: number; estimated_days_min: number; estimated_days_max: number; active: boolean };

export function AdminShippingManager({ regions, initialRates }: { regions: ShippingRegion[]; initialRates: ShippingRate[] }) {
  const [region, setRegion] = useState(regions[0]?.code ?? "");
  const [query, setQuery] = useState("");
  const [rates, setRates] = useState(initialRates);
  const [editing, setEditing] = useState<ShippingRate | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const shown = useMemo(() => rates.filter((rate) => rate.region_code === region && rate.commune_name.toLocaleLowerCase("es-CL").includes(query.toLocaleLowerCase("es-CL"))), [rates, region, query]);
  const currentRegion = regions.find((item) => item.code === region);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const values = { price: Number(form.get("price")), estimated_days_min: Number(form.get("days_min")), estimated_days_max: Number(form.get("days_max")), updated_at: new Date().toISOString() };
    if (values.estimated_days_max < values.estimated_days_min) return setMessage("El plazo máximo no puede ser menor al mínimo.");
    setBusy(true);
    const { error } = await supabase.from("shipping_rates").update(values).eq("commune_code", editing.commune_code);
    setBusy(false);
    if (error) return setMessage(error.message);
    setRates((rows) => rows.map((row) => row.commune_code === editing.commune_code ? { ...row, ...values } : row));
    setEditing(null);
    setMessage("Tarifa actualizada correctamente.");
  }

  async function toggle(rate: ShippingRate) {
    const { error } = await supabase.from("shipping_rates").update({ active: !rate.active, updated_at: new Date().toISOString() }).eq("commune_code", rate.commune_code);
    if (error) return setMessage(error.message);
    setRates((rows) => rows.map((row) => row.commune_code === rate.commune_code ? { ...row, active: !row.active } : row));
  }

  return <>
    <section className="shipping-toolbar">
      <label>Región<select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label>Buscar comuna<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. Providencia" /></label>
      <div><strong>{shown.length}</strong><span>comunas mostradas</span></div>
    </section>
    {message && <p className="admin-table-message" role="status">{message}</p>}
    <section className="admin-panel-card shipping-table-card">
      <header><div><span className="admin-eyebrow">Cobertura regional</span><h2>{currentRegion?.name}</h2></div><span>{rates.filter((rate) => rate.region_code === region && rate.active).length} activas</span></header>
      <div className="admin-table-wrap"><table><thead><tr><th>Comuna</th><th>Tarifa</th><th>Plazo estimado</th><th>Estado</th><th className="admin-actions-heading">Acciones</th></tr></thead><tbody>{shown.map((rate) => <tr key={rate.commune_code}><td><strong>{rate.commune_name}</strong></td><td>${Number(rate.price).toLocaleString("es-CL")}</td><td>{rate.estimated_days_min}–{rate.estimated_days_max} días hábiles</td><td><span className={rate.active ? "admin-status is-active" : "admin-status"}>{rate.active ? "Disponible" : "No disponible"}</span></td><td><div className="admin-product-actions"><button type="button" title="Editar tarifa" aria-label={`Editar envío a ${rate.commune_name}`} onClick={() => setEditing(rate)}><svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></button><button type="button" title={rate.active ? "Desactivar despacho" : "Activar despacho"} aria-label={`${rate.active ? "Desactivar" : "Activar"} despacho a ${rate.commune_name}`} className={rate.active ? "is-on" : ""} onClick={() => toggle(rate)}><svg viewBox="0 0 24 24"><path d="M3 12h18M12 3v18"/></svg></button></div></td></tr>)}</tbody></table></div>
    </section>
    {editing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}><form className="admin-modal shipping-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="admin-eyebrow">Editar forma de envío</span><h2>{editing.commune_name}</h2><p>{regions.find((item) => item.code === editing.region_code)?.name}</p></div><button type="button" aria-label="Cerrar" onClick={() => setEditing(null)}>×</button></header><label>Tarifa de envío (CLP)<input name="price" type="number" min="0" step="100" defaultValue={editing.price} required /></label><div className="admin-form-row"><label>Plazo mínimo (días hábiles)<input name="days_min" type="number" min="1" defaultValue={editing.estimated_days_min} required /></label><label>Plazo máximo (días hábiles)<input name="days_max" type="number" min="1" defaultValue={editing.estimated_days_max} required /></label></div><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar tarifa"}</button></form></div>}
  </>;
}
