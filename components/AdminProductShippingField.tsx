"use client";

import { useState } from "react";
import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";
import { AutomaticShippingUnavailable, bluePackageSize, parseProductPackage, INSTALLATION_NOTICE, type ProductPackage } from "@/lib/blue-shipping";

export function AdminProductShippingField({ value, parcel }: { value?: ProductShippingScope | null; parcel?: ProductPackage }) {
  const [measurements, setMeasurements] = useState({
    package_weight_kg: String(parcel?.package_weight_kg ?? ""), package_length_cm: String(parcel?.package_length_cm ?? ""),
    package_width_cm: String(parcel?.package_width_cm ?? ""), package_height_cm: String(parcel?.package_height_cm ?? ""),
  });
  const [freightMode, setFreightMode] = useState(parcel?.shipping_fallback_mode ?? "coordinate");
  const [installation, setInstallation] = useState(parcel?.installation_required ?? false);
  let packageIssue = "";
  try { bluePackageSize(parseProductPackage(measurements)); }
  catch (error) { if (error instanceof AutomaticShippingUnavailable) packageIssue = error.message; }
  return <><label>
    Cobertura de despacho
    <select name="shipping_scope" defaultValue={value ?? ""}>
      <option value="">Sin etiqueta (usar cobertura de la categoría)</option>
      <option value="rm">{productShippingLabel("rm")}</option>
      <option value="chile">{productShippingLabel("chile")}</option>
    </select>
    <small>Se mostrará junto al precio y los botones del producto. La cobertura elegida también se aplicará al finalizar la compra.</small>
  </label>
    <label>Tipo de entrega<select name="delivery_type" value={installation ? "installation" : "shipping"} onChange={event => setInstallation(event.target.value === "installation")}>
      <option value="shipping">Despacho a domicilio</option>
      <option value="installation">{INSTALLATION_NOTICE}</option>
    </select></label>
    {installation ? <>
      <p>El cliente coordina el flete y la instalación con la tienda antes de pagar. Puedes guardar la ficha sin peso ni medidas.</p>
      {Object.entries(measurements).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    </> : <>
    <p><strong>Embalaje (opcional)</strong><br />Con el peso y las tres medidas calculamos el despacho por tamaño. Si falta algún dato, se cobra la tarifa estándar de la comuna de destino.</p>
    <div className="admin-form-row">
      {([
        ["package_weight_kg", "Peso embalado (kg)", "0.001", "Ej. 2.5"],
        ["package_length_cm", "Largo embalado (cm)", "0.1", "Ej. 40"],
        ["package_width_cm", "Ancho embalado (cm)", "0.1", "Ej. 40"],
        ["package_height_cm", "Alto embalado (cm)", "0.1", "Ej. 12"],
      ] as const).map(([field,label,step,placeholder]) => <label key={field}>{label}<input name={field} type="number" min={step} max="1000" step={step} value={measurements[field]} onChange={event => setMeasurements(current => ({ ...current, [field]: event.target.value }))} placeholder={placeholder} /></label>)}
    </div>
    <small>Incluye caja y protección. Las tarifas y los descuentos se administran en Envíos. Cada unidad se calcula como un bulto separado.</small>
    <details className="admin-freight-settings" open={Boolean(packageIssue) || freightMode === "fixed"}>
      <summary>Flete especial · solo si no hay tarifa automática</summary>
      <div className="admin-freight-settings-body">
        {packageIssue && <p className="admin-freight-reason" role="status">{packageIssue}</p>}
        <p>Esta excepción se usa cuando el tamaño, el peso o el destino quedan fuera de la cobertura del transportista.</p>
        <label>Cuando no hay tarifa automática<select name="shipping_fallback_mode" value={freightMode} onChange={event => setFreightMode(event.target.value as "coordinate" | "fixed")}>
          <option value="coordinate">Coordinar flete antes de pagar</option>
          <option value="fixed">Definir valor de flete</option>
        </select></label>
        {freightMode === "fixed" ? <label>Valor de flete por unidad (CLP)<input name="shipping_fallback_price" type="number" min="1" max="999999999" step="1" required defaultValue={parcel?.shipping_fallback_price ?? ""} placeholder="Ej. 25000" /><small>IVA incluido. Se aplica por unidad a los destinos permitidos por la cobertura del producto y se muestra antes de pagar. Ingresa un valor confirmado para esos destinos.</small></label>
          : <small>El cliente verá “Flete por coordinar” y podrá contactarte. El pago quedará pendiente hasta que definas el valor; no se mostrará como envío gratis.</small>}
      </div>
    </details></>}
  </>;
}
