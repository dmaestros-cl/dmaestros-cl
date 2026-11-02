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
