import test from "node:test";
import assert from "node:assert/strict";
import { bluePackageSize, blueUnitPrice, parseProductPackage, packageFromForm, productDeliveryQuote, FreightCoordinationRequired, parseFreightSettings } from "../lib/blue-shipping.ts";
import { productShippingQuote, DEFAULT_SHIPPING_RULES } from "../lib/product-shipping-price.ts";

const parcel = { shipping_automatic: true, package_weight_kg: 1, package_length_cm: 10, package_width_cm: 10, package_height_cm: 10 };
const destination = { commune_code: "vs0101", region_code: "CL-VS", blue_enabled: true, blue_zone: "centro", blue_xs: null, blue_s: null, blue_m: null, blue_l: null };
const config = { originRegion: "CL-RM", originZone: "santiago", tariffs: [
  { region_code: "local", xs: 3100, s: 4200, m: 4800, l: 5400 },
  { region_code: "central", xs: 4300, s: 5600, m: 7300, l: 9200 },
  { region_code: "extreme", xs: 5200, s: 9500, m: 14500, l: 17000 },
] };

test("Blue uses packaged measurements, exact weight bands and volumetric weight", () => {
  for (const [weight, band] of [[0.5,"xs"],[0.501,"s"],[3,"s"],[3.001,"m"],[6,"m"],[6.001,"l"],[16,"l"],[16.001,"l"],[20,"l"]]) assert.equal(bluePackageSize({...parcel,package_weight_kg:weight}).band,band);
  const vol = bluePackageSize({...parcel,package_length_cm:30,package_width_cm:30,package_height_cm:30});
  assert.equal(vol.weight,6.75); assert.equal(vol.band,"l");
  assert.equal(bluePackageSize({...parcel,package_length_cm:40,package_width_cm:40,package_height_cm:40}).band,"l");
  assert.throws(()=>blueUnitPrice({...parcel,package_weight_kg:20.001},destination,config),/20 kg/);
  assert.throws(()=>blueUnitPrice({...parcel,package_length_cm:50,package_width_cm:50,package_height_cm:50},destination,config),/20 kg/);
});

test("Blue origin, destination overrides and zero amounts remain explicit", () => {
  assert.equal(blueUnitPrice(parcel,destination,config),5600);
  assert.equal(blueUnitPrice(parcel,{...destination,region_code:"CL-RM",blue_zone:"santiago"},config),4200);
  assert.equal(blueUnitPrice(parcel,{...destination,blue_s:0},config),0);
  assert.equal(blueUnitPrice(parcel,{...destination,blue_s:1234},config),1234);
  assert.throws(()=>blueUnitPrice(parcel,destination,{...config,originRegion:null}),/origen/);
  assert.throws(()=>blueUnitPrice(parcel,{...destination,blue_enabled:false},config),/coordinar/);
  assert.throws(()=>blueUnitPrice(parcel,{...destination,blue_zone:"pendiente"},config),/confirmación/);
  assert.equal(blueUnitPrice(parcel,{...destination,region_code:"CL-AN",blue_zone:"extremo"},config),9500);
  assert.equal(blueUnitPrice(parcel,{...destination,region_code:"CL-AN",blue_zone:"extremo"},{...config,originRegion:"CL-AN",originZone:"extremo"}),4200);
});

test("missing and invalid measurements do not become invented prices; oversize requires coordination", () => {
  for (const weight of [null,"",0,-1,NaN,Infinity,true,1.0001]) assert.throws(()=>parseProductPackage({...parcel,package_weight_kg:weight}));
  assert.throws(()=>parseProductPackage({...parcel,package_length_cm:10.01}));
  assert.throws(()=>bluePackageSize({...parcel,package_length_cm:70.1}),/70 cm/);
  assert.equal(bluePackageSize({...parcel,package_length_cm:70}).band,"s");
  assert.throws(()=>parseProductPackage({...parcel,shipping_automatic:false,package_weight_kg:null}),/Completa/);
  assert.equal(parseProductPackage({...parcel,package_weight_kg:null},false).package_weight_kg,null);
});

test("entering measurements always enables automatic shipping without a mode or price", () => {
  const form = new FormData();
  for (const [key,value] of Object.entries(parcel)) if (key !== 'shipping_automatic') form.set(key,String(value));
  assert.equal(packageFromForm(form).shipping_automatic,true);
  form.set('shipping_automatic','false'); form.set('shipping_price','1');
  assert.equal(packageFromForm(form).shipping_automatic,true);
  form.delete('package_weight_kg');
  assert.throws(()=>packageFromForm(form),/Completa/);
});

test("special freight is only used outside automatic coverage and coordination never means free", () => {
  const fixed = { ...parcel, shipping_fallback_mode: 'fixed', shipping_fallback_price: 25000 };
  assert.deepEqual(productDeliveryQuote(fixed,destination,config),{price:5600,method:'automatic'});
  assert.deepEqual(productDeliveryQuote({...fixed,package_length_cm:80},destination,config),{price:25000,method:'freight'});
  assert.deepEqual(productDeliveryQuote(fixed,{...destination,blue_enabled:false},config),{price:25000,method:'freight'});
  for (const oversized of [{package_length_cm:80},{package_weight_kg:21},{package_length_cm:50,package_width_cm:50,package_height_cm:50}]) {
    assert.throws(()=>productDeliveryQuote({...parcel,...oversized},destination,config),FreightCoordinationRequired);
  }
  assert.throws(()=>productDeliveryQuote({...fixed,package_weight_kg:null},destination,config),/Completa/);
  assert.throws(()=>productDeliveryQuote({...fixed,package_length_cm:80},destination,{...config,originRegion:null}),/origen/);
  assert.throws(()=>productDeliveryQuote({...fixed,package_length_cm:80},destination,{...config,tariffs:[]}),/tarifa/);
  for (const price of [null,0,-1,1.5,1000000000]) assert.throws(()=>parseFreightSettings({...fixed,shipping_fallback_price:price}));
  assert.deepEqual(parseFreightSettings({shipping_fallback_mode:'coordinate',shipping_fallback_price:25000}),{shipping_fallback_mode:'coordinate',shipping_fallback_price:null});
  const lines = [
    {shippingPrice:productDeliveryQuote(parcel,destination,config).price,quantity:2},
    {shippingPrice:productDeliveryQuote({...fixed,package_length_cm:80},destination,config).price,quantity:1},
  ];
  assert.equal(productShippingQuote(lines,0).total,36200);
  assert.equal(productShippingQuote(lines,0,{...DEFAULT_SHIPPING_RULES,quantity_discount_enabled:true}).total,18100);
});
