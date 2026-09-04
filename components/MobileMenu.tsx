"use client";

import { useState } from "react";

const links = [["Muebles", "#productos"], ["Cavas y bares", "#productos"], ["Cajas para corchos", "#productos-bar"], ["Juegos de cerveza", "#productos-bar"], ["Coffee Bar", "#productos-bar"]];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-menu-control">
      <button type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>MENÚ</span><i aria-hidden="true" />
      </button>
      {open && (
        <nav className="mobile-menu-panel" aria-label="Menú móvil">
          {links.map(([label, href]) => <a href={href} key={label} onClick={() => setOpen(false)}>{label}</a>)}
          <a href="#whatsapp" onClick={() => setOpen(false)}>Contacto</a>
        </nav>
      )}
    </div>
  );
}
