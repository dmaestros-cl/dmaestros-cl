export type ProductShippingScope = "rm" | "chile";

export function parseProductShippingScope(value: unknown): ProductShippingScope | null {
  return value === "rm" || value === "chile" ? value : null;
}

export function productShipsOnlyToRM(scope: string | null | undefined, categoryRmOnly: boolean = false) {
  if (scope === "rm") return true;
  if (scope === "chile") return false;
  return categoryRmOnly;
}

export function productShippingLabel(scope: ProductShippingScope) {
  return scope === "rm" ? "Despacho solo Región Metropolitana" : "Despacho a todo Chile";
}
