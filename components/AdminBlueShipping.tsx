"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BLUE_BANDS, BLUE_SOURCE_URL, BLUE_ROUTE_LABELS, type BlueTariff } from "@/lib/blue-shipping";
import { parseProductShippingPrice } from "@/lib/product-shipping-price";
import type { ShippingRegion } from "./AdminShippingManager";
import styles from "./AdminFreeShippingSettings.module.css";

export function AdminBlueShipping({ regions, communes, initialTariffs, initialOrigin }: {
  regions: ShippingRegion[];
  communes: { commune_code: string; commune_name: string; region_code: string }[];
  initialTariffs: BlueTariff[] | null;
  initialOrigin: string | null;
}) {
  const [tariffs, setTariffs] = useState(initialTariffs);
  const [origin, setOrigin] = useState(initialOrigin ?? "");
  const [savedOrigin, setSavedOrigin] = useState(initialOrigin ?? "");
  const [editing, setEditing] = useState<BlueTariff | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const regionName = (code: string) => BLUE_ROUTE_LABELS[code] ?? code;

  async function saveOrigin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: saveError } = await createClient().from("shipping_settings").update({ origin_commune_code: origin, updated_at: new Date().toISOString() }).eq("id", true).select("origin_commune_code").single();
      if (saveError) throw saveError;
      setSavedOrigin(data.origin_commune_code); setMessage("Origen de despacho guardado.");
    } catch { setError("No se pudo guardar el origen. Revisa tu sesión e inténtalo nuevamente."); }
    finally { setBusy(false); }
  }

  async function saveTariff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing || busy) return;
    const form = new FormData(event.currentTarget); setError(""); setMessage("");
    try {
      const values = Object.fromEntries(BLUE_BANDS.map(key => {
        const value = parseProductShippingPrice(form.get(key));
        if (value === null) throw new Error("Completa todos los valores de la tarifa.");
        return [key, value];
      }));
      setBusy(true);
      const { data, error: saveError } = await createClient().from("blue_pyme_tariffs").update({ ...values, updated_at: new Date().toISOString() }).eq("region_code", editing.region_code).select("region_code,xs,s,m,l").single();
      if (saveError) throw saveError;
      setTariffs(rows => rows?.map(row => row.region_code === data.region_code ? data as BlueTariff : row) ?? null);
      setEditing(null); setMessage("Tarifa guardada. Se aplicará a las nuevas compras.");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo guardar la tarifa."); }
    finally { setBusy(false); }
  }

  return <section className={`admin-panel-card ${styles.card}`} aria-labelledby="blue-title">
    <header className={styles.header}><div><span className="admin-eyebrow">Peso, medidas y destino</span><h2 id="blue-title">Tarifas por peso y volumen</h2><p>Entrega a domicilio · valores de referencia editables · IVA incluido.</p></div></header>
    <p className={styles.note}>Precios iniciales del <a href={BLUE_SOURCE_URL} target="_blank" rel="noreferrer">tarifario oficial para emprendedores</a>, consultado el 2 de noviembre de 2026. Son referencias para fijar el cobro de tu tienda, no cotizaciones en tiempo real del transportista. Puedes editar todos los valores.</p>
    {!tariffs ? <p role="alert" className={styles.error}>No fue posible cargar el tarifario. Recarga la página.</p> : <>
      <form onSubmit={saveOrigin} className={styles.fields}>
        <label className={styles.minimum}>Comuna de origen<select value={origin} required disabled={busy} onChange={event => { setOrigin(event.target.value); setMessage(""); }}>
          <option value="">Selecciona desde dónde despachas</option>
          {regions.map(region => <optgroup key={region.code} label={region.name}>{communes.filter(commune => commune.region_code === region.code).map(commune => <option key={commune.commune_code} value={commune.commune_code}>{commune.commune_name}</option>)}</optgroup>)}
        </select></label>
        {!savedOrigin && <p className={styles.error}>Falta guardar el origen para habilitar cotizaciones automáticas.</p>}
        <div className={styles.actions}><button className="admin-primary-button" disabled={busy || !origin || origin === savedOrigin}>Guardar origen</button></div>
      </form>
      <div className="admin-table-wrap"><table className="blue-tariff-table"><caption>Tarifa por unidad embalada. Se usa el mayor entre peso real y volumétrico.</caption><thead><tr><th>Destino</th><th>XS ≤ 0,5 kg</th><th>S ≤ 3 kg</th><th>M ≤ 6 kg</th><th>L ≤ 20 kg</th><th>Editar</th></tr></thead><tbody>
        {tariffs.map(row => <tr key={row.region_code}><th scope="row">{regionName(row.region_code)}</th>{BLUE_BANDS.map(key => <td key={key}>${row[key].toLocaleString("es-CL")}</td>)}<td><button className="admin-secondary-button" type="button" onClick={() => { setEditing(row); setError(""); }} aria-label={`Editar tarifa por peso ${regionName(row.region_code)}`}>Editar</button></td></tr>)}
      </tbody></table></div>
      <p className={styles.note}>Máximo 20 kg físicos o volumétricos y 70 cm por lado. Los paquetes mayores requieren tarifa manual. La zona y los valores de cada comuna se pueden editar en la tabla inferior. Los descuentos del carrito se aplican después. La agrupación inicial de la RM usa como referencia las <a href="https://www.puntooriente.cl/pages/tarifas-de-despacho" target="_blank" rel="noreferrer">tarifas públicas de Punto Oriente</a>; puedes cambiarla por comuna.</p>
    </>}
    {message && <p className={styles.success} role="status">{message}</p>}
    {error && !editing && <p className={styles.error} role="alert">{error}</p>}
    {editing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !busy && setEditing(null)}><form className="admin-modal shipping-modal" onSubmit={saveTariff} onMouseDown={event => event.stopPropagation()}>
      <header><div><span className="admin-eyebrow">Tarifa por peso</span><h2>{regionName(editing.region_code)}</h2><p>Entrega a domicilio · IVA incluido</p></div><button type="button" aria-label="Cerrar tarifa por peso" disabled={busy} onClick={() => setEditing(null)}>×</button></header>
      <div className="admin-form-row">{BLUE_BANDS.map((band, index) => <label key={band}>{band.toUpperCase()} · hasta {["0,5", "3", "6", "20"][index]} kg (CLP)<input name={band} type="number" min="0" max="999999999" step="1" defaultValue={editing[band]} required disabled={busy} /></label>)}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar tarifa por peso"}</button>
    </form></div>}
  </section>;
}
