type ProductPricing = {
  sale_mode: string;
  price: number | null;
  sale_price: number | null;
};

export function validateProductPricing(product: ProductPricing): string | null {
  const { price, sale_price: offer, sale_mode: mode } = product;

  if (mode === "buy" && (price == null || !Number.isSafeInteger(price) || price <= 0)) {
    return "Ingresa un precio normal mayor que 0 para habilitar la compra online.";
  }

  if (offer != null && (price == null || !Number.isSafeInteger(offer) || offer <= 0 || offer >= price)) {
    return "El precio oferta debe ser mayor que 0 y menor que el precio normal.";
  }

  return null;
}
