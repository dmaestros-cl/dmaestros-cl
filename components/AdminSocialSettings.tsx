"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SocialSettings = { instagram_url: string; instagram_active: boolean; facebook_url: string; facebook_active: boolean; youtube_url: string; youtube_active: boolean; tiktok_url: string; tiktok_active: boolean };

const networks = [
  { key: "instagram", label: "Instagram", icon: "/images/brands/instagram.svg", placeholder: "https://instagram.com/dmaestros" },
  { key: "facebook", label: "Facebook", icon: "/images/brands/facebook.svg", placeholder: "https://facebook.com/dmaestros" },
  { key: "youtube", label: "YouTube", icon: "/images/brands/youtube.svg", placeholder: "https://youtube.com/@dmaestros" },
  { key: "tiktok", label: "TikTok", icon: "/images/brands/tiktok.svg", placeholder: "https://www.tiktok.com/@dmaestros" },
] as const;

export function AdminSocialSettings({ initialSettings }: { initialSettings: SocialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { error } = await createClient().from("store_settings").update({ ...settings, updated_at: new Date().toISOString() }).eq("id", true).select("id").single();
    setBusy(false); setMessage(error ? error.message : "Redes sociales actualizadas correctamente.");
  }
  return <form className="admin-panel-card admin-social-settings" onSubmit={save}><span className="admin-eyebrow">Pie de página</span><h2>Redes sociales</h2><p>Edita el enlace y decide qué redes se muestran públicamente.</p><div className="admin-social-list">{networks.map((network) => {
    const urlKey = `${network.key}_url` as keyof SocialSettings;
    const activeKey = `${network.key}_active` as keyof SocialSettings;
    return <div className="admin-social-row" key={network.key}><span className="admin-social-icon"><Image src={network.icon} alt="" width={24} height={24} /></span><label><strong>{network.label}</strong><input type="url" value={String(settings[urlKey])} onChange={(event) => setSettings((current) => ({ ...current, [urlKey]: event.target.value }))} placeholder={network.placeholder} /></label><label className="admin-switch"><input type="checkbox" checked={Boolean(settings[activeKey])} onChange={(event) => setSettings((current) => ({ ...current, [activeKey]: event.target.checked }))} /><span aria-hidden="true" /><small>{settings[activeKey] ? "Visible" : "Oculta"}</small></label></div>;
  })}</div><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar redes sociales"}</button>{message && <p className="admin-form-message" role="status">{message}</p>}</form>;
}
