"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminStoreSettings({ whatsappNumber }: { whatsappNumber: string }) {
  const [number, setNumber] = useState(whatsappNumber);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const clean = number.replace(/\D/g, "");
    const { error } = await createClient().from("store_settings").upsert({ id: true, whatsapp_number: clean, updated_at: new Date().toISOString() });
    setBusy(false);
    setMessage(error ? error.message : "Número de WhatsApp guardado.");
    if (!error) setNumber(clean);
  }
  return <form className="admin-panel-card admin-store-settings" onSubmit={save}><span className="admin-eyebrow">Ventas</span><h2>WhatsApp para cotizaciones</h2><p>Incluye código de país y número, solo dígitos. Ejemplo Chile: 56912345678.</p><label>Número de WhatsApp<input value={number} onChange={(event) => setNumber(event.target.value)} inputMode="tel" placeholder="56912345678" required /></label><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar número"}</button>{message && <p className="admin-form-message" role="status">{message}</p>}</form>;
}
