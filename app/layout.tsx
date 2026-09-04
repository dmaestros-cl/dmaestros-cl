import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMaestros | Muebles y juguetes en madera",
  description: "Piezas de madera noble hechas a mano con dedicación y pasión.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
