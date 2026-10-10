import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/">DM<span>MAESTROS</span></Link>
        <p className="admin-eyebrow">Panel administrador</p>
        <h1>Gestiona tu tienda</h1>
        <p>Recibirás un enlace de acceso sin contraseña en el correo autorizado.</p>
        {error && <div className="admin-alert">No fue posible iniciar sesión o el usuario no está autorizado.</div>}
        <AdminLoginForm />
        <Link className="admin-back-link" href="/">← Volver al sitio</Link>
      </section>
    </main>
  );
}
