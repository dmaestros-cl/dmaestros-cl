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

## Despacho automático por peso y volumen

En Productos → Editar se elige **Automático · peso y medidas** y se ingresan kg y cm del producto **embalado**, con su caja y protección. Cada unidad se cotiza como un bulto separado. Los productos existentes conservan el modo manual hasta completar su ficha; no se infieren pesos ni embalajes a partir de las descripciones.

En Envíos → Tarifas por peso y volumen se guarda la comuna de origen (Santiago, confirmada por el usuario) y se editan los cuatro tramos. Cada comuna tiene una zona de referencia editable: Santiago, Centro o Extremo. Se usa la tarifa local dentro de la misma zona y región; entre Santiago/Centro o entre regiones del Centro se usa Central; los restantes trayectos que involucran Extremo usan Extremo.

En la tabla de comunas se pueden reemplazar los valores de cada tramo o deshabilitar el automático para ese destino. Un campo vacío hereda; cero es un precio válido. Las tarifas manuales anteriores siguen separadas.

El usuario confirmó que utiliza la plataforma de emprendedores y luego autorizó **valores reales de referencia editables, sin exigir exactitud con Blue Express**. Fuentes consultadas el 2026-11-02:

- [Tarifario oficial Blue Express Pyme](https://www.blue.cl/docs/enviar/tarifario-pyme.pdf): precios iniciales de entrega a domicilio, IVA incluido. Local XS/S/M/L: 3.100/4.200/4.800/5.400; Central: 4.300/5.600/7.300/9.200; Extremo: 5.200/9.500/14.500/17.000.
- [Guía oficial de tallas](https://www.blue.cl/nosotros/centro-de-ayuda/tallas-envio): se compara peso físico con largo × ancho × alto / 4.000.
- [Políticas públicas de Punto Oriente](https://www.puntooriente.cl/pages/tarifas-de-despacho): referencia comercial para separar Curacaví, María Pinto, Melipilla, San Pedro, Alhué y El Monte del resto de RM. Esta agrupación es una referencia editable, no una zonificación oficial validada por Blue Express.

No se consulta al transportista en tiempo real ni se compran etiquetas. El administrador controla las actualizaciones y el precio final cobrado por DMaestros.

- Tramos inclusivos: XS 0,5 kg; S 3 kg; M 6 kg; L 20 kg.
- Máximo de 70 cm por lado y 20 kg físicos o volumétricos. Bultos mayores requieren tarifa manual o coordinación; no se inventan recargos fuera del tarifario.
- No se extrapola la entrega terrestre a Isla de Pascua, Juan Fernández o Antártica: el automático comienza deshabilitado para esos destinos y puede configurarse desde Envíos.
- La cobertura Solo RM, retiro, descuentos y promociones se mantienen. Una promoción no vuelve válido un bulto o destino no habilitado.
- `create_webpay_order` calcula nuevamente desde las medidas y tarifas de la base de datos. Cambios posteriores no alteran intentos de pago ya creados.

La migración `20261102210000_blue_express_shipping.sql` añadió medidas y configuración. `20261102211000_blue_pyme_tariff.sql` selecciona las tarifas Pyme y las zonas tras confirmar la modalidad con el usuario. La tabla ecommerce inicial queda sin uso; el checkout utiliza exclusivamente `blue_pyme_tariffs`. No se asignan medidas a productos existentes.
