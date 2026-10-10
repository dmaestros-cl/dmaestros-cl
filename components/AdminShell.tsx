"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["Pedidos", "/admin/pedidos", "▣"],
  ["Productos", "/admin/productos", "◇"],
  ["Categorías", "/admin/categorias", "▦"],
  ["Envíos", "/admin/envios", "⌁"],
  ["Configuración", "/admin/configuracion", "⚙"],
] as const;

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
        <Link className="admin-brand" href="/admin"><strong>DM</strong><span>DMaestros</span></Link>
        <nav aria-label="Administración">
          {links.map(([label, href, icon]) => <Link className={pathname === href ? "is-active" : ""} href={href} key={href}><i>{icon}</i>{label}</Link>)}
        </nav>
        <div className="admin-account"><span>Administrador</span><small>{email}</small><button onClick={signOut}>Cerrar sesión</button></div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar"><div><span>Panel administrador</span><strong>DMaestros</strong></div><Link href="/" target="_blank">Ver tienda ↗</Link></header>
        <main>{children}</main>
      </div>
    </div>
  );
}
