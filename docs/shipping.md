# Despacho por producto

En Productos → Editar, debajo de Cobertura de despacho, se configura el precio de despacho por unidad en CLP.

- Vacío (`shipping_price = null`): usa la tarifa general por comuna existente.
- Cero: envío gratis para ese producto.
- Monto positivo: precio fijo para los destinos habilitados; se suma por cada unidad comprada.
- En carritos mixtos se suman los precios propios y una sola tarifa general si hay productos sin precio propio. Un carrito totalmente sin configurar conserva el cálculo anterior.
- Las promociones de envío gratis y la restricción Solo RM siguen aplicándose. El precio propio no habilita una comuna desactivada.
- El checkout vuelve a consultar precios y cobertura antes de iniciar el pago. `create_webpay_order` recalcula desde la base de datos, valida el total esperado y no modifica intentos de pago existentes.

La migración `20261102150000_product_shipping_price.sql` agrega la columna, conserva los permisos de productos y actualiza únicamente el cálculo de despacho de pedidos nuevos. No asigna precios a productos existentes.

Verificación: `npm run test:shipping` y `npm run test:webpay` ejecutan las migraciones reales en PostgreSQL local con PGlite, incluyendo permisos, cantidades, carritos mixtos, promociones y rechazo de totales manipulados.

## Reglas personalizables

En Envíos → Reglas del carrito se configura:

- Sumar por unidad (predeterminado) o cobrar una sola vez el mayor precio de despacho.
- Activar o desactivar un descuento por cantidad, con mínimo inclusivo de unidades y porcentaje entero de 1 a 100.
- Se cuentan unidades, incluso del mismo SKU. El total con descuento se redondea al peso más cercano; los medios pesos se redondean hacia arriba.
- El descuento se aplica después del cálculo base; las promociones de envío gratis tienen prioridad. La cobertura y las comunas disponibles siguen siendo obligatorias.

`20261102160000_custom_shipping_rules.sql` agrega estas opciones al singleton `shipping_settings`, protegido por la política de administradores existente. La instalación conserva la suma por unidad y deja el descuento desactivado. Los valores de ejemplo (3 unidades, 50%) no se cobran hasta que el administrador active y guarde la regla.
