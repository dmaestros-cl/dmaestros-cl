import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";

export function ProductShippingNote({ scope, installation }: { scope?: ProductShippingScope | null; installation?: boolean }) {
  if (!scope && !installation) return null;
  return <span className="product-shipping-note">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11v11H7M14 10h4l3 4v3h-3M3 17h1M14 17h1" /><circle cx="5.5" cy="17.5" r="2" /><circle cx="16.5" cy="17.5" r="2" /></svg>
    <span>{[scope && productShippingLabel(scope), installation && "Flete e instalación a coordinar"].filter(Boolean).join(" · ")}</span>
  </span>;
}
