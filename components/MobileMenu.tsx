"use client";

import { useState } from "react";

const links = [
  ["Muebles", "/tienda?categoria=Muebles#catalogo"],
  ["Cavas y bares", "/tienda?categoria=Cavas%20y%20bares#catalogo"],
  ["Cajas para corchos", "/tienda?categoria=Cajas%20para%20corchos#catalogo"],
  ["Cajas mixtas", "/tienda?categoria=Cajas%20mixtas#catalogo"],
  ["Juegos de cerveza", "/tienda?categoria=Juegos%20de%20cerveza#catalogo"],
  ["Coffee Bar", "/tienda?categoria=Coffee%20Bar#catalogo"],
];

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
