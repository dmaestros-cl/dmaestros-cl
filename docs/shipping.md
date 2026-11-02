# Despacho automático

El flujo normal de despacho usa peso y medidas del producto embalado. En Productos → Editar se ingresan peso (kg), largo, ancho y alto (cm). No se elige modalidad ni se escribe un precio para los envíos con cobertura automática.

Al elegir la comuna en el checkout, cada unidad se calcula como un bulto. Se usa el mayor entre peso físico y largo × ancho × alto / 4.000. La cobertura Solo RM, el retiro fuera de RM, las promociones y las reglas de cantidades se conservan.

Los productos existentes sin datos de embalaje aparecen pendientes en el panel. No se inventan medidas ni se cobra una tarifa fija de reemplazo. Para guardar la ficha se requieren los cuatro datos. Los intentos de pago existentes mantienen sus importes.

## Tarifas y cobertura

En Envíos se configura el origen (Santiago), los precios por tramo y las excepciones por comuna. Las zonas de referencia son Santiago, Centro y Extremo. Dentro de la misma zona y región se usa Local; Santiago/Centro y Centro entre regiones usan Central; los demás trayectos que involucran Extremo usan Extremo.

Un valor por comuna vacío hereda la tarifa de su trayecto y cero significa gratis. Las antiguas tarifas planas por producto o comuna ya no intervienen en el cálculo.

Fuentes consultadas el 2026-11-02:

- [Tarifario oficial Blue Express Pyme](https://www.blue.cl/docs/enviar/tarifario-pyme.pdf): precios de entrega a domicilio con IVA. Local XS/S/M/L: 3.100/4.200/4.800/5.400; Central: 4.300/5.600/7.300/9.200; Extremo: 5.200/9.500/14.500/17.000.
- [Guía de tallas](https://www.blue.cl/nosotros/centro-de-ayuda/tallas-envio): comparación entre peso físico y volumétrico.
- [Políticas de Punto Oriente](https://www.puntooriente.cl/pages/tarifas-de-despacho): referencia comercial para separar Curacaví, María Pinto, Melipilla, San Pedro, Alhué y El Monte del resto de RM. No es una zonificación oficial validada por Blue Express.

El usuario autorizó precios públicos reales como referencias editables; no son cotizaciones del transportista en tiempo real. Los tramos inclusivos son 0,5 / 3 / 6 / 20 kg, con máximo 70 cm por lado. Fuera de estos límites se aplica la política de flete especial. Isla de Pascua, Juan Fernández y Antártica comienzan sin cobertura automática. No existe una conexión en vivo con Starken ni se afirma que un bulto fuera de este tarifario sea rechazado por todos los transportistas.

## Flete especial

El usuario autorizó expresamente dos opciones solo cuando no se disponga de envío automático. En la ficha, “Flete especial · solo si no hay tarifa automática” se despliega al detectar peso o dimensiones fuera de los límites. También se puede abrir para configurar excepciones de destino.

- **Coordinar flete antes de pagar** (predeterminado): el checkout muestra “Flete por coordinar”, total por confirmar y un enlace a WhatsApp con productos, cantidades y comuna. No crea un pago ni presenta el envío como gratuito. Si la tienda no tiene WhatsApp configurado, lleva a Contacto.
- **Definir valor de flete**: el administrador ingresa explícitamente un importe positivo por unidad, IVA incluido, confirmado para los destinos permitidos por la cobertura del producto. Se aplican las reglas del carrito y se informa al comprador que el plazo del flete se coordina con la tienda.

La cotización automática siempre tiene prioridad, aunque exista un valor de flete guardado. La excepción solo se activa por dimensiones/peso fuera del tarifario o por un destino sin cobertura automática. No oculta errores de configuración, no habilita comunas desactivadas y no sustituye medidas faltantes. Coordinar flete tampoco se omite por una promoción de envío gratis.

La migración 20261102224000_exceptional_freight incorpora shipping_fallback_mode y shipping_fallback_price, valida la elección y actualiza el cálculo autoritativo de nuevos pedidos. Los precios anteriores y los intentos de pago ya creados se conservan.

## Reglas del carrito

En Envíos → Reglas del carrito se puede sumar por unidad o cobrar solo el mayor envío. El descuento opcional por cantidad tiene mínimo inclusivo de unidades y porcentaje de 1 a 100. Se cuentan unidades aunque compartan SKU; el resultado se redondea al peso, con medios pesos hacia arriba. Las promociones de envío gratis se aplican después, sin habilitar destinos o bultos sin cobertura.

## Integridad y verificación

El checkout vuelve a consultar medidas, cobertura y tarifas antes del pago. La base de datos recalcula independientemente y rechaza importes manipulados o desactualizados. Los permisos limitan las modificaciones a administradores.

La migración 20261102223000_automatic_shipping_only elimina el uso de precios fijos y del selector anterior para pedidos nuevos. Conserva sus columnas como historial, pero sus valores no afectan el cálculo. Los productos pasan a automático sin alterar sus medidas. La migración 20261102212000_public_shipping_origin permite usar una comuna como origen aunque se deshabiliten entregas hacia ella.

Validación: npm run test:shipping y npm run test:webpay usan PostgreSQL local con PGlite y las migraciones reales. Cubren datos faltantes, límites, precios manipulados, modo anterior ignorado, descuentos, cobertura, permisos e idempotencia de pagos.
