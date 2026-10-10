"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin-constants";

export function AdminLoginForm() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("Este correo no tiene permisos de administrador.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    setLoading(false);
    setMessage(error ? error.message : "Revisa tu correo: enviamos un enlace seguro para entrar.");
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label>Correo administrador<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <button type="submit" disabled={loading}>{loading ? "Enviando…" : "Enviar enlace de acceso"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
