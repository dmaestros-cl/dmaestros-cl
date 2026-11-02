import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";
import { MAX_PRODUCT_SHIPPING_PRICE } from "@/lib/product-shipping-price";

export function AdminProductShippingField({ value, price }: { value?: ProductShippingScope | null; price?: number | null }) {
  return <><label>
    Cobertura de despacho
    <select name="shipping_scope" defaultValue={value ?? ""}>
      <option value="">Sin etiqueta (usar cobertura de la categoría)</option>
      <option value="rm">{productShippingLabel("rm")}</option>
      <option value="chile">{productShippingLabel("chile")}</option>
    </select>
    <small>Se mostrará junto al precio y los botones del producto. La cobertura elegida también se aplicará al finalizar la compra.</small>
  </label>
    <label>
      Precio de despacho por unidad (CLP)
      <input name="shipping_price" type="number" min="0" max={MAX_PRODUCT_SHIPPING_PRICE} step="1" defaultValue={price ?? ""} placeholder="Usar tarifa general por comuna" />
      <small>Precio fijo para los destinos habilitados. Se suma por cada unidad comprada. Escribe 0 para despacho gratis o deja vacío para usar la tarifa general por comuna.</small>
      <small>Si el carrito mezcla productos con precio propio y productos sin configurar, se suman los precios propios y una sola tarifa general. Las promociones de envío gratis siguen aplicándose.</small>
    </label>
  </>;
}
