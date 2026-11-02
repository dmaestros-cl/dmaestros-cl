export const MAX_PRODUCT_SHIPPING_PRICE = 999_999_999;

// Blank inherits the commune tariff; zero explicitly means free delivery.
export function parseProductShippingPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") throw new Error("Ingresa un valor de despacho válido en pesos chilenos.");
  if (typeof value === "string" && value.trim() === "") return null;
  const price = Number(value);
  if (!Number.isSafeInteger(price) || price < 0 || price > MAX_PRODUCT_SHIPPING_PRICE) {
    throw new Error("El despacho debe ser un monto entero entre $0 y $999.999.999.");
  }
  return price;
}

export type ProductShippingLine = { shippingPrice: number | null; quantity: number };

export function productShippingCost(lines: ProductShippingLine[], communePrice: number): number {
  let amount = 0;
  let usesCommunePrice = false;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error("Cantidad de despacho no válida.");
    const price = parseProductShippingPrice(line.shippingPrice);
    if (price === null) usesCommunePrice = true;
    else amount += price * line.quantity;
  }
  // Preserve the existing single commune charge for all unconfigured products.
  if (usesCommunePrice) {
    const price = parseProductShippingPrice(communePrice);
    if (price === null) throw new Error("Tarifa general de despacho no disponible.");
    amount += price;
  }
  return amount;
}
