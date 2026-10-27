import type { CatalogProduct } from "@/lib/catalog";

export function ProductCardPrice({
  product,
}: {
  product: Pick<CatalogProduct, "price" | "salePrice" | "saleMode">;
}) {
  const { price, salePrice, saleMode } = product;

  if (saleMode !== "buy" || price == null) {
    return null;
  }

  const hasOffer = salePrice != null && salePrice >= 0 && salePrice < price;

  return (
    <div className={`product-card-price${hasOffer ? " has-offer" : ""}`}>
      {hasOffer ? (
        <>
          <span className="sr-only">Precio normal:</span>
          <del>${price.toLocaleString("es-CL")}</del>
          <span className="sr-only">Precio oferta:</span>
          <strong>${salePrice.toLocaleString("es-CL")}</strong>
        </>
      ) : (
        <strong>${price.toLocaleString("es-CL")}</strong>
      )}
    </div>
  );
}
