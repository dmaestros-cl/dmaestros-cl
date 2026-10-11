"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

type Profile = { first_name: string; last_name: string; email: string; phone: string; address: string };
type Mode = "login" | "register" | "recover";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>{!hidden && <path d="m4 4 16 16"/>}</svg>;
}

function PasswordInput({ name, label, visible, onToggle }: { name: string; label: string; visible: boolean; onToggle: () => void }) {
  return <label>{label}<div className="password-field"><input name={name} type={visible ? "text" : "password"} autoComplete={name === "password" ? "new-password" : "new-password"} minLength={8} required /><button type="button" onClick={onToggle} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}><EyeIcon hidden={visible} /></button></div></label>;
}

export function CustomerAccount({ profile, recovery = false }: { profile: Profile | null; recovery?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const supabase = createClient();

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
    setBusy(false); if (error) return setMessage(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message); router.refresh();
  }

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget); const password = String(form.get("password"));
    if (password !== String(form.get("repeat_password"))) return setMessage("Las contraseñas no coinciden.");
    if (password.length < 8) return setMessage("La contraseña debe tener al menos 8 caracteres.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: String(form.get("email")).trim(), password, options: { data: { first_name: String(form.get("first_name")).trim(), last_name: String(form.get("last_name")).trim(), phone: String(form.get("phone")).trim(), address: String(form.get("address")).trim() } } });
    setBusy(false); if (error) return setMessage(error.message); if (!data.session) return setMessage("Cuenta creada. Inicia sesión con tu correo y contraseña."); router.refresh();
  }

  async function requestRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/cuenta?recovery=1")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")).trim(), { redirectTo });
    setBusy(false); if (error) return setMessage(error.message);
    setSuccess({ title: "Revisa tu correo", message: "Si existe una cuenta asociada, recibirás un enlace seguro para crear una nueva contraseña." });
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget); const password = String(form.get("password"));
    if (password !== String(form.get("repeat_password"))) return setMessage("Las contraseñas no coinciden.");
    if (password.length < 8) return setMessage("La contraseña debe tener al menos 8 caracteres.");
    setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false);
    if (error) return setMessage(error.message);
    await fetch("/api/auth/password-notification", { method: "POST" }).catch(() => undefined);
    setSuccess({ title: "Contraseña actualizada", message: "Tu nueva contraseña quedó guardada. Ya puedes ingresar normalmente a tu cuenta." });
  }

  async function logout() { await supabase.auth.signOut(); router.refresh(); }

  if (recovery) return <><section className="customer-account-card customer-recovery-card"><header><span className="customer-account-kicker">Cuenta protegida</span><h1>Nueva contraseña</h1><p>Define una contraseña segura para recuperar el acceso.</p></header><form className="customer-auth-form" onSubmit={updatePassword}><PasswordInput name="password" label="Nueva contraseña" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /><PasswordInput name="repeat_password" label="Repetir contraseña" visible={showRepeat} onToggle={() => setShowRepeat((value) => !value)} /><small className="customer-password-hint">Usa al menos 8 caracteres y evita contraseñas utilizadas anteriormente.</small><button className="customer-auth-submit" disabled={busy}>{busy ? "Actualizando…" : "Guardar nueva contraseña"}</button></form>{message && <p className="customer-auth-message" role="alert">{message}</p>}</section>{success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => { setSuccess(null); router.replace("/cuenta"); router.refresh(); }} />}</>;

  if (profile) return <section className="customer-account-card customer-profile"><span className="customer-account-kicker">Mi cuenta</span><h1>Hola, {profile.first_name}</h1><p>Estos son los datos asociados a tu cuenta.</p><dl><div><dt>Nombre</dt><dd>{profile.first_name} {profile.last_name}</dd></div><div><dt>Correo</dt><dd>{profile.email}</dd></div><div><dt>Teléfono</dt><dd>{profile.phone}</dd></div><div><dt>Dirección</dt><dd>{profile.address}</dd></div></dl><button type="button" onClick={logout}>Cerrar sesión</button></section>;

  const switchMode = (next: Mode) => { setMode(next); setMessage(""); };
  return <><section className="customer-account-card"><header><span className="customer-account-kicker">DMaestros</span><h1>{mode === "login" ? "Bienvenido" : mode === "register" ? "Crea tu cuenta" : "Recupera tu acceso"}</h1><p>{mode === "login" ? "Ingresa para revisar tus datos y pedidos." : mode === "register" ? "Completa tus datos para comprar más rápido." : "Te enviaremos un enlace seguro para crear una nueva contraseña."}</p></header>{mode !== "recover" && <div className="customer-auth-tabs"><button className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>Ingresar</button><button className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>Crear cuenta</button></div>}{mode === "login" ? <form className="customer-auth-form" onSubmit={login}><label>Correo<input name="email" type="email" autoComplete="email" required /></label><label>Contraseña<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><EyeIcon hidden={showPassword} /></button></div></label><button className="customer-forgot-button" type="button" onClick={() => switchMode("recover")}>¿Olvidaste tu contraseña?</button><button className="customer-auth-submit" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button></form> : mode === "recover" ? <form className="customer-auth-form customer-recovery-form" onSubmit={requestRecovery}><label>Correo de tu cuenta<input name="email" type="email" autoComplete="email" placeholder="nombre@correo.cl" required /></label><button className="customer-auth-submit" disabled={busy}>{busy ? "Enviando enlace…" : "Enviar enlace de recuperación"}</button><button className="customer-recovery-back" type="button" onClick={() => switchMode("login")}>← Volver al ingreso</button></form> : <form className="customer-auth-form customer-register-form" onSubmit={register}><div className="customer-form-row"><label>Nombre<input name="first_name" autoComplete="given-name" required /></label><label>Apellidos<input name="last_name" autoComplete="family-name" required /></label></div><div className="customer-form-row"><label>Correo<input name="email" type="email" autoComplete="email" required /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" required /></label></div><label>Dirección<input name="address" autoComplete="street-address" required /></label><div className="customer-form-row"><PasswordInput name="password" label="Contraseña" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /><PasswordInput name="repeat_password" label="Repetir contraseña" visible={showRepeat} onToggle={() => setShowRepeat((value) => !value)} /></div><button className="customer-auth-submit" disabled={busy}>{busy ? "Creando cuenta…" : "Crear cuenta"}</button></form>}{message && <p className="customer-auth-message" role="alert">{message}</p>}</section>{success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => { setSuccess(null); switchMode("login"); }} />}</>;
}
