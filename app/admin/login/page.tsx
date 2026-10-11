import Link from "next/link";
import Image from "next/image";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/" aria-label="DMaestros, volver al sitio"><Image src="/images/logo-dmaestros.png" alt="DMaestros" width={260} height={64} priority /></Link>
        <p className="admin-eyebrow">Panel administrador</p>
        <h1>Gestiona tu tienda</h1>
        <p>Ingresa el correo y la clave de administrador para acceder.</p>
        {error && <div className="admin-alert">No fue posible iniciar sesión o el usuario no está autorizado.</div>}
        <AdminLoginForm />
        <Link className="admin-back-link" href="/">← Volver al sitio</Link>
      </section>
    </main>
  );
}
