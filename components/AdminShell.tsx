"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["Pedidos", "/admin/pedidos", "orders"],
  ["Productos", "/admin/productos", "products"],
  ["Categorías", "/admin/categorias", "categories"],
  ["Envíos", "/admin/envios", "shipping"],
  ["Configuración", "/admin/configuracion", "settings"],
] as const;

function NavIcon({ name }: { name: (typeof links)[number][2] }) {
  const paths = {
    orders: <><path d="M7 3h10v3H7z"/><path d="M5 5h14v16H5zM8 10h8M8 14h8M8 18h5"/></>,
    products: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v9"/></>,
    categories: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    shipping: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function AdminBrandLogo() {
  return <svg className="admin-brand-logo" viewBox="0 0 1348 328" role="img" aria-label="DMaestros"><filter id="admin-logo-white" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 -1 -1 0 2.94" /></filter><image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#admin-logo-white)" /></svg>;
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="DMaestros, panel administrador"><AdminBrandLogo /></Link>
        <nav aria-label="Administración">
          {links.map(([label, href, icon]) => <Link className={pathname === href ? "is-active" : ""} href={href} key={href}><i><NavIcon name={icon} /></i>{label}</Link>)}
        </nav>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar-title"><span>Panel administrador</span><strong>DMaestros</strong></div>
          <div className="admin-topbar-actions">
            <Link href="/" target="_blank">Ver tienda ↗</Link>
            <div className="admin-account">
              <span className="admin-account-avatar" aria-hidden="true">A</span>
              <span className="admin-account-copy"><strong>Administrador</strong><small>{email}</small></span>
              <button onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión"><svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg></button>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
