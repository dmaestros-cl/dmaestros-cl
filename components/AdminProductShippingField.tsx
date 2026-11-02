"use client";

import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";
import { type ProductPackage } from "@/lib/blue-shipping";

export function AdminProductShippingField({ value, parcel }: { value?: ProductShippingScope | null; parcel?: ProductPackage }) {
  return <><label>
    Cobertura de despacho
    <select name="shipping_scope" defaultValue={value ?? ""}>
      <option value="">Sin etiqueta (usar cobertura de la categoría)</option>
      <option value="rm">{productShippingLabel("rm")}</option>
      <option value="chile">{productShippingLabel("chile")}</option>
    </select>
    <small>Se mostrará junto al precio y los botones del producto. La cobertura elegida también se aplicará al finalizar la compra.</small>
  </label>
    <p><strong>Despacho automático</strong><br />Ingresa el peso y las medidas con embalaje. El sistema calcula el envío cuando el comprador elige su comuna.</p>
    <div className="admin-form-row">
      <label>Peso embalado (kg)<input name="package_weight_kg" type="number" min="0.001" max="1000" step="0.001" defaultValue={parcel?.package_weight_kg ?? ""} required placeholder="Ej. 2.5" /></label>
      <label>Largo embalado (cm)<input name="package_length_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_length_cm ?? ""} required placeholder="Ej. 40" /></label>
      <label>Ancho embalado (cm)<input name="package_width_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_width_cm ?? ""} required placeholder="Ej. 40" /></label>
      <label>Alto embalado (cm)<input name="package_height_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_height_cm ?? ""} required placeholder="Ej. 12" /></label>
    </div>
    <small>Incluye caja y protección. Las tarifas y los descuentos se administran en Envíos. Cada unidad se calcula como un bulto separado.</small>
  </>;
}
