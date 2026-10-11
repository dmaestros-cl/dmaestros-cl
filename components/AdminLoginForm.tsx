"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin-constants";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("Este correo no tiene permisos de administrador.");
      return;
    }
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setMessage("Clave incorrecta. Intenta nuevamente.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus required /></label>
      <label>Clave<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      <button type="submit" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
