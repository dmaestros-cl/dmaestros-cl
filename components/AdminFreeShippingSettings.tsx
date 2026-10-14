"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_SHIPPING_THRESHOLD, parseShippingSettings, SHIPPING_SETTINGS_COLUMNS, type ShippingSettings } from "@/lib/shipping-policy";
import styles from "./AdminFreeShippingSettings.module.css";

export function AdminFreeShippingSettings({ initialSettings }: { initialSettings: ShippingSettings | null }) {
  const [saved, setSaved] = useState(initialSettings);
  const [enabled, setEnabled] = useState(Boolean(initialSettings && initialSettings.mode !== "disabled"));
  const [mode, setMode] = useState<"all" | "threshold">(initialSettings?.mode === "threshold" ? "threshold" : "all");
  const [minimum, setMinimum] = useState(initialSettings?.minimum_subtotal?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const draftMode = enabled ? mode : "disabled";
  const draftMinimum = enabled && mode === "threshold" ? Number(minimum) : saved?.minimum_subtotal ?? null;
  const dirty = saved && (draftMode !== saved.mode || draftMinimum !== saved.minimum_subtotal);
  const activeDescription = saved?.mode === "all" ? "Envío gratis en todas las compras" : saved?.mode === "threshold" ? `Envío gratis desde $${saved.minimum_subtotal!.toLocaleString("es-CL")}` : "Se aplican las tarifas por comuna";

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved || saving.current) return;
    setError("");
    setMessage("");
    let settings: ShippingSettings;
    try {
      settings = parseShippingSettings({ mode: draftMode, minimum_subtotal: draftMinimum });
    } catch {
      setError("Ingresa un monto mínimo válido en pesos, sin decimales.");
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const { data, error: saveError } = await createClient().from("shipping_settings")
        .update({ ...settings, updated_at: new Date().toISOString() }).eq("id", true)
        .select(SHIPPING_SETTINGS_COLUMNS).single();
      if (saveError) throw saveError;
      const updated = parseShippingSettings(data);
      setSaved(updated);
      setMessage(updated.mode === "disabled" ? "Envío gratis desactivado. Se aplicarán las tarifas por comuna." : "Configuración guardada. El envío gratis se aplicará automáticamente en el checkout.");
    } catch {
      setError("No se pudo guardar. Tus cambios no se aplicaron; revisa tu sesión de administrador e inténtalo nuevamente.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <section className={`admin-panel-card ${styles.card}`} aria-labelledby="free-shipping-title">
    <header className={styles.header}>
      <div><span className="admin-eyebrow">Beneficios de envío</span><h2 id="free-shipping-title">Envío gratis</h2><p>Actívalo para todas las compras o desde un monto mínimo.</p></div>
      <span className={`${styles.badge} ${saved && saved.mode !== "disabled" ? styles.active : ""}`}>{saved ? saved.mode === "disabled" ? "Desactivado" : "Activo" : "No disponible"}</span>
    </header>
    {!saved ? <p className={styles.error} role="alert">No se pudo cargar la configuración de envío gratis. Actualiza la página o verifica que la configuración esté instalada en la base de datos.</p> : <form onSubmit={save}>
      <fieldset className={styles.fields} disabled={busy}>
        <label className={styles.toggle}>
          <span><strong>Activar envío gratis</strong><small>Los cambios se aplican al guardar.</small></span>
          <input type="checkbox" role="switch" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); setMessage(""); }} />
          <span className={styles.track} aria-hidden="true" />
        </label>
        {enabled && <fieldset className={styles.modes}>
          <legend>¿Cuándo se aplica?</legend>
          <label className={styles.option}>
            <input type="radio" name="free-shipping-mode" value="all" checked={mode === "all"} onChange={() => { setMode("all"); setMessage(""); }} />
            <span><strong>Todos los envíos gratis</strong><small>Sin monto mínimo de compra.</small></span>
          </label>
          <label className={styles.option}>
            <input type="radio" name="free-shipping-mode" value="threshold" checked={mode === "threshold"} onChange={() => { setMode("threshold"); setMessage(""); }} />
            <span><strong>Desde un monto mínimo</strong><small>Para compras iguales o superiores al monto indicado.</small></span>
          </label>
          {mode === "threshold" && <label className={styles.minimum}>Monto mínimo de productos (CLP)
            <input type="number" inputMode="numeric" min="1" max={MAX_SHIPPING_THRESHOLD} step="1" value={minimum} onChange={(event) => { setMinimum(event.target.value); setMessage(""); }} placeholder="Ej. 100000" aria-describedby="free-shipping-help" required />
            <small id="free-shipping-help">Se usa el subtotal de productos con sus descuentos, sin incluir el despacho.</small>
          </label>}
        </fieldset>}
        <p className={styles.note}>Aplica solo a comunas con despacho disponible. Se mantienen las restricciones de retiro en taller. Las tarifas base no se modifican.</p>
        <div className={styles.actions}><button className="admin-primary-button" type="submit" disabled={busy || !dirty}>{busy ? "Guardando…" : "Guardar envío gratis"}</button><span>{dirty ? "Cambios sin guardar" : activeDescription}</span></div>
      </fieldset>
      {message && <p className={styles.success} role="status">{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>}
  </section>;
}
