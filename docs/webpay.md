# Webpay Plus — DMaestros

## Estado y activación

La integración usa la API REST Webpay Plus v1.2. La primera publicación es **en modo de prueba**, por petición del propietario. Usa el código oficial de integración `597055555532` y su API key pública. `WEBPAY_ALLOW_TEST_ON_PRODUCTION=true` permite probar en el dominio publicado, con aviso visible en checkout y comprobante. Los pedidos llevan `payment_environment=integration` y no se pueden despachar desde el panel.

El código de comercio real solicitado es **597053098347**, reservado para la activación productiva posterior. El código por sí solo NO habilita cobros reales: Transbank debe entregar su **API Key Secret de producción**. No pegar claves privadas en chats ni subirlas a GitHub.

Para activar cobros reales posteriormente (NO durante pruebas), configurar en el servidor/Vercel:

| Variable | Valor |
| --- | --- |
| `WEBPAY_ENVIRONMENT` | `production` |
| `WEBPAY_COMMERCE_CODE` | `597053098347` |
| `WEBPAY_API_KEY_SECRET` | Secreto productivo entregado por Transbank |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada del proyecto Supabase, solo servidor |
| `SITE_URL` | `https://www.dmaestros.cl` |
| `WEBPAY_ALLOW_TEST_ON_PRODUCTION` | `false` |

1. Aplicar `supabase/migrations/20261013150000_webpay_plus.sql` con acceso autorizado al proyecto correcto. La migración crea transacciones privadas y funciones exclusivas de `service_role`; retira la inserción pública de pedidos con montos arbitrarios. Coordinar migración y despliegue en una ventana de mantenimiento del checkout.
2. Configurar las variables anteriores como Secret donde corresponda y desplegar. Sin configuración completa, el endpoint rechaza la compra antes de insertar pedidos o llamar a Transbank. No hay fallback silencioso a pruebas.
3. Completar la validación exigida por Transbank. No declarar producción operativa sin una prueba autorizada de creación, pago, retorno y confirmación persistida.

Retorno: `https://www.dmaestros.cl/api/payments/webpay/return`. Acepta GET y POST. No es un webhook de pagos autenticado por firma: cada retorno se verifica consultando directamente a Transbank.

## Pruebas

Preferir un proyecto Supabase **separado de producción**, con sus migraciones aplicadas. Para la prueba en el sitio publicado solicitada por el propietario, cada pedido de integración se identifica explícitamente y el panel bloquea su despacho. En local configurar `WEBPAY_ENVIRONMENT=integration`, `SITE_URL=http://localhost:3000` y el código/API key públicos de integración indicados en la documentación oficial. Nunca mezclar el código productivo con la API key de integración. Vercel Preview rechaza configuración productiva; Vercel Production requiere habilitación explícita para pruebas.

Ejecutar `npm run test:webpay`, `npm run lint` y `npm run build`. Los tests SQL usan PostgreSQL embebido aislado, no datos reales. Luego probar en navegador con las tarjetas de prueba oficiales:

- Pago aprobado: total del servidor + despacho, comprobante, pedido pagado y limpieza solo de los productos comprados.
- Rechazo, cancelación, timeout y retorno combinado de error: nunca mostrar éxito sin `AUTHORIZED` y `response_code === 0` verificados.
- Recargar retorno y reenviar checkout: reutiliza intento; no crear/cobrar otro pedido por un reintento de red.
- Fallo de red durante confirmación: consultar estado; no volver a cobrar. El comprobante permite consultar nuevamente.
- Alterar total/cantidad/SKU/comuna en el navegador: validación SQL impide iniciar un cobro incorrecto.
- Sin credenciales: error controlado, carrito intacto, ningún cobro.
- Probar escritorio y móvil; las tarjetas se ingresan exclusivamente en Transbank.

## Seguridad y operación

Precios, ofertas, disponibilidad manual y tarifas se resuelven en SQL en una transacción junto al pedido y sus líneas. Se mantiene la política existente de disponibilidad manual: stock positivo limita la cantidad; stock cero con disponibilidad manual activa permite fabricación a pedido. No se implementan reservas automáticas de inventario.

Los clientes no pueden leer/escribir `webpay_transactions` ni ejecutar las funciones de pago. No se almacenan PAN completo ni CVV; solo los últimos cuatro dígitos devueltos por Transbank. Las credenciales y tokens no se imprimen en logs. El comprobante usa una cookie HttpOnly y consultas sin caché; no acepta un parámetro del navegador como prueba de aprobación.

Los callbacks se serializan con un bloqueo temporal persistido y la confirmación se valida contra monto, orden y sesión. Un pago aprobado no se degrada por un callback repetido. Las claves de idempotencia se reutilizan para el mismo carrito/datos; un carrito distinto es una compra distinta. El límite de creación es de 20 intentos/hora por IP seudonimizada en Vercel.

Si el comprador cierra la pestaña antes de retornar, no habrá confirmación automática en segundo plano: revisar transacciones pendientes y reconciliar con Transbank antes de despachar. La consulta está disponible en el comprobante y para operación manual; no hay cron de conciliación ni reembolsos automáticos en esta entrega. Cancelar un despacho en el panel NO reembolsa el pago.

El administrador puede eliminar un pedido con confirmación de su número. La operación `admin_delete_order` borra atómicamente `webpay_transactions`, `order_items` y `orders`; no modifica cuentas, catálogo, imágenes compartidas, respaldos ni registros en Transbank, y NO reembolsa dinero. Se bloquea mientras el pago se está verificando o existe un pago productivo pendiente. Exportar/conservar los antecedentes necesarios antes de eliminar un pago real autorizado: el comprobante de la tienda deja de estar disponible. Los pedidos no tienen archivos propios almacenados en Vercel ni Supabase Storage; la tienda consulta la base de datos en cada solicitud autenticada y los contadores del panel se actualizan al eliminar.

## Referencias oficiales

- [Flujo Webpay Plus](https://transbankdevelopers.cl/documentacion/webpay-plus)
- [API y credenciales](https://transbankdevelopers.cl/referencia/webpay)
- [Documentación oficial en GitHub](https://github.com/TransbankDevelopers/transbank-developers-docs/tree/master/referencia/webpay)
