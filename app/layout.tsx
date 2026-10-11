import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { NavigationScrollReset } from "@/components/NavigationScrollReset";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMaestros | Muebles y juguetes en madera",
  description: "Piezas de madera noble hechas a mano con dedicación y pasión.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          {children}
          <SiteFooter />
          <NavigationScrollReset />
        </CartProvider>
      </body>
    </html>
  );
}
