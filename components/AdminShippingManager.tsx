"use client";

import { useMemo, useState } from "react";
import { BLUE_BANDS, BLUE_RATE_COLUMNS, BLUE_ZONE_LABELS, type BlueZone, type BlueCommune } from "@/lib/blue-shipping";
import { parseProductShippingPrice } from "@/lib/product-shipping-price";
import { createClient } from "@/lib/supabase/client";

export type ShippingRegion = { code: string; name: string; sort_order: number };
export type ShippingRate = BlueCommune & { commune_code: string; region_code: string; commune_name: string; price: number; estimated_days_min: number; estimated_days_max: number; active: boolean };

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
    let standard: number | null;
    let prices: Record<string, number | null>;
    try { standard = parseProductShippingPrice(form.get("price"));
      if (standard === null) throw new Error("Ingresa la tarifa estándar de la comuna. Usa 0 solo si el despacho es gratis.");
      prices = Object.fromEntries(BLUE_BANDS.map(band => `blue_${band}`).map(key => [key, parseProductShippingPrice(form.get(key))])); }
    catch (error) { return setMessage(error instanceof Error ? error.message : "Revisa las tarifas."); }
    const zone = String(form.get("blue_zone")) as BlueZone;
    if (!(zone in BLUE_ZONE_LABELS)) return setMessage("Selecciona una zona de despacho válida.");
    const values = { ...prices, price: standard, blue_zone: zone, blue_enabled: form.get("blue_enabled") === "on", estimated_days_min: Number(form.get("days_min")), estimated_days_max: Number(form.get("days_max")), updated_at: new Date().toISOString() };
    if (!Number.isInteger(values.estimated_days_min) || !Number.isInteger(values.estimated_days_max) || values.estimated_days_min < 1 || values.estimated_days_max < values.estimated_days_min) return setMessage("El plazo máximo no puede ser menor al mínimo.");
    setBusy(true);
    const { data, error } = await supabase.from("shipping_rates").update(values).eq("commune_code", editing.commune_code).select(`commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max,active,${BLUE_RATE_COLUMNS}`).single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setRates((rows) => rows.map((row) => row.commune_code === editing.commune_code ? { ...data, price: Number(data.price) } as ShippingRate : row));
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
      <div className="admin-table-wrap"><table><thead><tr><th>Comuna</th><th>Tarifa estándar</th><th>Cálculo por peso</th><th>Plazo estimado</th><th>Estado</th><th className="admin-actions-heading">Acciones</th></tr></thead><tbody>{shown.map((rate) => <tr key={rate.commune_code}><td><strong>{rate.commune_name}</strong></td><td>{rate.blue_enabled ? `$${rate.price.toLocaleString("es-CL")}` : "Flete especial"}</td><td>{!rate.blue_enabled ? "Coordinar despacho" : rate.blue_zone === "pendiente" ? "Zona por confirmar" : BLUE_BANDS.some(band => rate[`blue_${band}`] !== null) ? "Tarifa personalizada" : `Según peso · ${BLUE_ZONE_LABELS[rate.blue_zone]}`}</td><td>{rate.estimated_days_min}–{rate.estimated_days_max} días hábiles</td><td><span className={rate.active ? "admin-status is-active" : "admin-status"}>{rate.active ? "Disponible" : "No disponible"}</span></td><td><div className="admin-product-actions"><button type="button" title="Editar tarifa" aria-label={`Editar envío a ${rate.commune_name}`} onClick={() => { setMessage(""); setEditing(rate); }}><svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></button><button type="button" title={rate.active ? "Desactivar despacho" : "Activar despacho"} aria-label={`${rate.active ? "Desactivar" : "Activar"} despacho a ${rate.commune_name}`} className={rate.active ? "is-on" : ""} onClick={() => toggle(rate)}><svg viewBox="0 0 24 24"><path d="M3 12h18M12 3v18"/></svg></button></div></td></tr>)}</tbody></table></div>
    </section>
    {editing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !busy && setEditing(null)}><form className="admin-modal shipping-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="admin-eyebrow">Editar forma de envío</span><h2>{editing.commune_name}</h2><p>{regions.find((item) => item.code === editing.region_code)?.name}</p></div><button type="button" aria-label="Cerrar" disabled={busy} onClick={() => setEditing(null)}>×</button></header><label>Tarifa estándar por unidad (CLP)<input type="number" name="price" min="0" max="999999999" step="1" defaultValue={editing.price} required /><small>Se cobra cuando falta el peso o alguna medida del embalaje. Ingresa 0 solo si quieres ofrecer despacho gratis.</small></label><fieldset className="shipping-blue-overrides"><legend>Tarifa por peso para esta comuna</legend><label><input name="blue_enabled" type="checkbox" defaultChecked={editing.blue_enabled} /> Despacho disponible para esta comuna</label><label>Zona de referencia<select name="blue_zone" defaultValue={editing.blue_zone}>{Object.entries(BLUE_ZONE_LABELS).map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select></label><p>Puedes cambiar la zona de referencia y ajustar lo que cobra tu tienda. Cada monto vacío hereda la tabla por trayecto. Un valor 0 significa gratis. Estas excepciones reemplazan el tramo correspondiente, incluyendo los envíos locales.</p><div className="admin-form-row">{BLUE_BANDS.map((band, index) => <label key={band}>{band.toUpperCase()} · hasta {["0,5", "3", "6", "20"][index]} kg<input name={`blue_${band}`} type="number" min="0" max="999999999" step="1" defaultValue={editing[`blue_${band}`] ?? ""} placeholder="Usar tarifa del trayecto" /></label>)}</div></fieldset><div className="admin-form-row"><label>Plazo mínimo (días hábiles)<input name="days_min" type="number" min="1" defaultValue={editing.estimated_days_min} required /></label><label>Plazo máximo (días hábiles)<input name="days_max" type="number" min="1" defaultValue={editing.estimated_days_max} required /></label></div>{message && <p role="status">{message}</p>}<button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar tarifa"}</button></form></div>}
  </>;
}
