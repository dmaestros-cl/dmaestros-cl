import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";

export function AdminProductShippingField({ value }: { value?: ProductShippingScope | null }) {
  return <label>
    Cobertura de despacho
    <select name="shipping_scope" defaultValue={value ?? ""}>
      <option value="">Sin etiqueta (usar cobertura de la categoría)</option>
      <option value="rm">{productShippingLabel("rm")}</option>
      <option value="chile">{productShippingLabel("chile")}</option>
    </select>
    <small>Se mostrará junto al precio y los botones del producto. La cobertura elegida también se aplicará al finalizar la compra.</small>
  </label>;
}
