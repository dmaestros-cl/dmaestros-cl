"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SHIPPING_RULES, parseShippingRules, SHIPPING_RULES_COLUMNS, type ShippingRules } from "@/lib/product-shipping-price";
import styles from "./AdminFreeShippingSettings.module.css";

export function AdminShippingRules({ initialRules }: { initialRules: ShippingRules | null }) {
  const [saved, setSaved] = useState(initialRules);
  const [mode, setMode] = useState(initialRules?.calculation_mode ?? DEFAULT_SHIPPING_RULES.calculation_mode);
  const [enabled, setEnabled] = useState(initialRules?.quantity_discount_enabled ?? false);
  const [minimum, setMinimum] = useState(String(initialRules?.quantity_discount_min_units ?? DEFAULT_SHIPPING_RULES.quantity_discount_min_units));
  const [percent, setPercent] = useState(String(initialRules?.quantity_discount_percent ?? DEFAULT_SHIPPING_RULES.quantity_discount_percent));
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const draft = { calculation_mode: mode, quantity_discount_enabled: enabled, quantity_discount_min_units: Number(minimum), quantity_discount_percent: Number(percent) };
  const dirty = saved && Object.entries(draft).some(([key, value]) => saved[key as keyof ShippingRules] !== value);
  const exampleUnits = Number(minimum);
  const validExample = Number.isInteger(exampleUnits) && exampleUnits >= 1 && exampleUnits <= 4950 && Number.isInteger(Number(percent)) && Number(percent) >= 1 && Number(percent) <= 100;
  const exampleBase = mode === "highest" ? 5000 : 5000 * exampleUnits;
  const exampleTotal = enabled ? Math.round(exampleBase * (100 - Number(percent)) / 100) : exampleBase;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved || saving.current) return;
    setError(""); setMessage("");
    let rules: ShippingRules;
    try { rules = parseShippingRules(draft); }
    catch (error) { setError(error instanceof Error ? error.message : "Revisa las reglas de despacho."); return; }
    saving.current = true; setBusy(true);
    try {
      const { data, error: saveError } = await createClient().from("shipping_settings")
        .update({ ...rules, updated_at: new Date().toISOString() }).eq("id", true).select(SHIPPING_RULES_COLUMNS).single();
      if (saveError) throw saveError;
      setSaved(parseShippingRules(data));
      setMessage("Reglas guardadas. Se aplicarán a las nuevas compras.");
    } catch {
      setError("No se pudieron guardar las reglas. Revisa tu sesión de administrador e inténtalo nuevamente.");
    } finally { saving.current = false; setBusy(false); }
  }

  return <section className={`admin-panel-card ${styles.card}`} aria-labelledby="shipping-rules-title">
    <header className={styles.header}>
      <div><span className="admin-eyebrow">Cálculo del despacho</span><h2 id="shipping-rules-title">Reglas del carrito</h2><p>Elige cómo cobrar el envío y configura descuentos por cantidad. Los cambios se aplican al guardar.</p></div>
      <span className={`${styles.badge} ${saved?.quantity_discount_enabled ? styles.active : ""}`}>{!saved ? "No disponible" : saved.quantity_discount_enabled ? "Descuento activo" : "Sin descuento"}</span>
    </header>
    {!saved ? <p className={styles.error} role="alert">No pudimos cargar las reglas de despacho. Actualiza la página.</p> : <form onSubmit={save}>
      <fieldset className={styles.fields} disabled={busy}>
        <fieldset className={styles.modes}>
          <legend>Forma de cobro</legend>
          <label className={styles.option}><input type="radio" name="shipping-calculation" checked={mode === "per_unit"} onChange={() => { setMode("per_unit"); setMessage(""); }} /><span><strong>Sumar por unidad</strong><small>El precio de despacho de cada producto se multiplica por su cantidad.</small></span></label>
          <label className={styles.option}><input type="radio" name="shipping-calculation" checked={mode === "highest"} onChange={() => { setMode("highest"); setMessage(""); }} /><span><strong>Cobrar solo el más alto</strong><small>Se cobra una vez el mayor precio de despacho del carrito.</small></span></label>
        </fieldset>
        <label className={styles.toggle}><span><strong>Activar descuento por cantidad</strong><small>Se aplica al total del despacho, después de calcularlo.</small></span><input type="checkbox" role="switch" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); setMessage(""); }} /><span className={styles.track} aria-hidden="true" /></label>
        <div className={styles.ruleInputs}>
          <label className={styles.minimum}>Desde cuántas unidades<input type="number" min="1" max="4950" step="1" value={minimum} onChange={(event) => { setMinimum(event.target.value); setMessage(""); }} required disabled={!enabled} /><small>Incluye esa cantidad. Por ejemplo: 3 aplica desde tres; 4 significa más de tres. Se cuentan unidades, aunque sean del mismo producto.</small></label>
          <label className={styles.minimum}>Descuento de despacho (%)<input type="number" min="1" max="100" step="1" value={percent} onChange={(event) => { setPercent(event.target.value); setMessage(""); }} required disabled={!enabled} /><small>50 cobra la mitad. 100 deja el despacho gratis. El resultado se redondea al peso más cercano.</small></label>
        </div>
        {validExample && <output className={styles.example} aria-live="polite">Ejemplo con {exampleUnits} unidades y un despacho de $5.000 por unidad: <strong>${exampleTotal.toLocaleString("es-CL")}</strong>{enabled ? ` de despacho, con ${percent}% de descuento.` : " de despacho."}</output>}
        <p className={styles.note}>Define el precio de cada producto en <Link href="/admin/productos">Productos → Editar</Link>. Si no tiene precio propio, se usa una sola tarifa general por comuna. Las promociones de envío gratis tienen prioridad y la cobertura Solo RM se mantiene.</p>
        <div className={styles.actions}><button className="admin-primary-button" type="submit" disabled={busy || !dirty}>{busy ? "Guardando…" : "Guardar reglas de despacho"}</button><span>{dirty ? "Cambios sin guardar" : "Configuración guardada"}</span></div>
      </fieldset>
      {message && <p className={styles.success} role="status">{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>}
  </section>;
}
