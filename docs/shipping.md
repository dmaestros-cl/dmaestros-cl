# Despacho automático

El único flujo de despacho usa peso y medidas del producto embalado. En Productos → Editar se ingresan peso (kg), largo, ancho y alto (cm). No se elige modalidad ni se escribe un precio por producto.

Al elegir la comuna en el checkout, cada unidad se calcula como un bulto. Se usa el mayor entre peso físico y largo × ancho × alto / 4.000. La cobertura Solo RM, el retiro fuera de RM, las promociones y las reglas de cantidades se conservan.

Los productos existentes sin datos de embalaje aparecen pendientes en el panel. No se inventan medidas ni se cobra una tarifa fija de reemplazo. Para guardar la ficha se requieren los cuatro datos. Los intentos de pago existentes mantienen sus importes.

## Tarifas y cobertura

En Envíos se configura el origen (Santiago), los precios por tramo y las excepciones por comuna. Las zonas de referencia son Santiago, Centro y Extremo. Dentro de la misma zona y región se usa Local; Santiago/Centro y Centro entre regiones usan Central; los demás trayectos que involucran Extremo usan Extremo.

Un valor por comuna vacío hereda la tarifa de su trayecto y cero significa gratis. No hay tarifa manual por producto ni tarifa plana por comuna en el flujo de compra.

Fuentes consultadas el 2026-11-02:

- [Tarifario oficial Blue Express Pyme](https://www.blue.cl/docs/enviar/tarifario-pyme.pdf): precios de entrega a domicilio con IVA. Local XS/S/M/L: 3.100/4.200/4.800/5.400; Central: 4.300/5.600/7.300/9.200; Extremo: 5.200/9.500/14.500/17.000.
- [Guía de tallas](https://www.blue.cl/nosotros/centro-de-ayuda/tallas-envio): comparación entre peso físico y volumétrico.
- [Políticas de Punto Oriente](https://www.puntooriente.cl/pages/tarifas-de-despacho): referencia comercial para separar Curacaví, María Pinto, Melipilla, San Pedro, Alhué y El Monte del resto de RM. No es una zonificación oficial validada por Blue Express.

El usuario autorizó precios públicos reales como referencias editables; no son cotizaciones del transportista en tiempo real. Los tramos inclusivos son 0,5 / 3 / 6 / 20 kg, con máximo 70 cm por lado. Fuera de estos límites falta integrar un servicio de carga con tarifa verificable; el sistema no extrapola valores ni cambia a un cobro manual. Isla de Pascua, Juan Fernández y Antártica comienzan sin cobertura automática.

## Reglas del carrito

En Envíos → Reglas del carrito se puede sumar por unidad o cobrar solo el mayor envío. El descuento opcional por cantidad tiene mínimo inclusivo de unidades y porcentaje de 1 a 100. Se cuentan unidades aunque compartan SKU; el resultado se redondea al peso, con medios pesos hacia arriba. Las promociones de envío gratis se aplican después, sin habilitar destinos o bultos sin cobertura.

## Integridad y verificación

El checkout vuelve a consultar medidas, cobertura y tarifas antes del pago. La base de datos recalcula independientemente y rechaza importes manipulados o desactualizados. Los permisos limitan las modificaciones a administradores.

La migración 20261102223000_automatic_shipping_only elimina el uso de precios fijos y del selector anterior para pedidos nuevos. Conserva sus columnas como historial, pero sus valores no afectan el cálculo. Los productos pasan a automático sin alterar sus medidas. La migración 20261102212000_public_shipping_origin permite usar una comuna como origen aunque se deshabiliten entregas hacia ella.

Validación: npm run test:shipping y npm run test:webpay usan PostgreSQL local con PGlite y las migraciones reales. Cubren datos faltantes, límites, precios manipulados, modo anterior ignorado, descuentos, cobertura, permisos e idempotencia de pagos.
