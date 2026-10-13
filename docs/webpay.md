# Webpay Plus — DMaestros

## Estado y activación

La integración usa la API REST Webpay Plus v1.2. La certificación se envió a Transbank el 13-10-2026 con las nueve operaciones requeridas. El checkout público ahora acepta exclusivamente configuración productiva completa; mientras no esté disponible muestra un aviso de pago no disponible y no crea pedidos ni llama a Transbank. No se han activado cobros reales.

Los pedidos con `payment_environment=integration` se conservan como antecedentes técnicos, pero se excluyen de Pedidos, sus contadores y el historial del cliente. No se borran ni se convierten en ventas. Sus comprobantes antiguos muestran «Operación no comercial» y no emiten confirmaciones de compra. Los registros manuales anteriores y los pedidos productivos siguen visibles.

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

El cambio pendiente es de configuración, no de textos ni código: actualizar ambiente, código de comercio y API Key en Vercel Production y redesplegar. Validar después el primer pago real autorizado y la entrega de ambas notificaciones. El buzón administrativo `ventasdmaestros@gmail.com` se conserva por instrucción del propietario, pero Gmail rechazó su entrega durante la certificación; debe resolverse/verificarse antes de afirmar que las notificaciones administrativas están operativas.

Retorno: `https://www.dmaestros.cl/api/payments/webpay/return`. Acepta GET y POST. No es un webhook de pagos autenticado por firma: cada retorno se verifica consultando directamente a Transbank.

## Pruebas

Preferir un proyecto Supabase **separado de producción**, con sus migraciones aplicadas. El checkout comercial ya no crea operaciones de integración, incluso si queda habilitada la variable histórica `WEBPAY_ALLOW_TEST_ON_PRODUCTION`. Esta variable solo permite reconciliar callbacks anteriores mientras siga configurado ese ambiente. Nunca mezclar credenciales de integración y producción. Vercel Preview rechaza configuración productiva. Las suites automatizadas utilizan PostgreSQL aislado y datos sintéticos, sin contactar a Transbank.

Ejecutar `npm run test:webpay`, `npm run lint` y `npm run build`. Los tests SQL usan PostgreSQL embebido aislado, no datos reales. Luego probar en navegador con las tarjetas de prueba oficiales:

- Pago aprobado: total del servidor + despacho, comprobante, pedido pagado y limpieza solo de los productos comprados.
- Rechazo, cancelación, timeout y retorno combinado de error: nunca mostrar éxito sin `AUTHORIZED` y `response_code === 0` verificados.
- Recargar retorno y reenviar checkout: reutiliza intento; no crear/cobrar otro pedido por un reintento de red.
- Fallo de red durante confirmación: consultar estado; no volver a cobrar. El comprobante permite consultar nuevamente.
- Alterar total/cantidad/SKU/comuna en el navegador: validación SQL impide iniciar un cobro incorrecto.
- Sin credenciales: error controlado, carrito intacto, ningún cobro.
- Probar escritorio y móvil; las tarjetas se ingresan exclusivamente en Transbank.

## Seguridad y operación

### Certificación y reembolsos exclusivamente de prueba

`scripts/webpay-certification.mjs` permite consultar una operación de integración y ejecutar los dos casos de reembolso exigidos por el validador. El host y las credenciales públicas de sandbox están fijados en el script; no acepta configuración productiva ni crea pagos o ingresa tarjetas. Las compras se realizan por el checkout normal y el formulario seguro de Transbank.

```sh
node scripts/webpay-certification.mjs status TOKEN ORDEN MONTO_ORIGINAL
node scripts/webpay-certification.mjs refund-test-only TOKEN ORDEN MONTO_ORIGINAL MONTO_REEMBOLSO RUTA_EVIDENCIA_JSON
```

Obtener el token y la orden exacta de una compra identificada como CERTIFICACIÓN WEBPAY, con `payment_environment=integration`. Antes del reembolso, la utilidad consulta a Transbank y exige coincidencia de orden/monto y autorización exitosa. No reintenta automáticamente un reembolso: si se pierde la respuesta, consultar estado y revisar la evidencia antes de actuar. Los JSON contienen tokens de certificación y deben mantenerse fuera de Git.

Esta utilidad **no habilita reembolsos productivos ni agrega un botón al panel**. Conserva la respuesta y el estado posterior de Transbank como evidencia; no reescribe la aprobación original del pedido ni simula resultados en la base de datos. Los pedidos de prueba continúan bloqueados para despacho. La futura operación de reembolsos reales requiere conciliación y persistencia específicas en el panel.

En las pruebas del 13-10-2026, la AMEX oficial de integración permitió crédito sin cuotas y tres cuotas. Usar las tarjetas publicadas en la documentación oficial vigente; nunca ingresar tarjetas reales en sandbox. La herramienta de validación exige nueve tokens de casos distintos, generados dentro de los últimos siete días.

### Confirmaciones por correo

Aplicar también `20261013203000_order_email_notifications.sql`. Al confirmar un pago se encolan, en la misma transacción, dos notificaciones privadas: comprador y administrador. No se encolan rechazos ni cancelaciones, ni se envían compras históricas retroactivamente. Configurar `RESEND_API_KEY`, `EMAIL_FROM` (dominio verificado) y `ADMIN_NOTIFICATION_EMAIL` en Vercel. El remitente actual es DMaestros; el destinatario administrativo es independiente del correo de acceso al panel.

Los callbacks y la consulta de estado procesan la cola después de responder mediante `after`. El envío exige `payment_environment=production` y pago autorizado antes de reclamar cualquier mensaje. La plantilla también rechaza ambientes no productivos. Cada mensaje contiene logo, número/fecha del pedido, contacto y envío, SKU/cantidades/precios, despacho, total y autorización con solo los últimos cuatro dígitos de tarjeta, sin etiquetas de certificación. Se envían HTML y texto plano, por separado para cada destinatario. No se exponen tokens, claves ni CVV. Los correos históricos ya entregados no se pueden retirar de los buzones.

La cola usa bloqueo temporal, un payload inmutable y una clave de idempotencia por pedido/destinatario. Se reintentan fallos transitorios hasta tres veces por ejecución (seis intentos totales), siempre dentro de 23 horas del primer intento; luego requieren revisión para evitar duplicados fuera de la ventana de 24h de Resend. No hay cron de reenvío: un proceso interrumpido se retoma al volver a consultar el pago. Revisar filas `failed`, `review` o bloqueos vencidos de `order_email_notifications` si el proveedor falla. `sent` significa aceptado por Resend; verificar `last_event=delivered` en Resend para acreditar entrega al servidor receptor, no lectura o carpeta de entrada. Eliminar el pedido elimina su cola local, no correos ya entregados ni registros del proveedor.

Precios, ofertas, disponibilidad manual y tarifas se resuelven en SQL en una transacción junto al pedido y sus líneas. Se mantiene la política existente de disponibilidad manual: stock positivo limita la cantidad; stock cero con disponibilidad manual activa permite fabricación a pedido. No se implementan reservas automáticas de inventario.

Los clientes no pueden leer/escribir `webpay_transactions` ni ejecutar las funciones de pago. No se almacenan PAN completo ni CVV; solo los últimos cuatro dígitos devueltos por Transbank. Las credenciales y tokens no se imprimen en logs. El comprobante usa una cookie HttpOnly y consultas sin caché; no acepta un parámetro del navegador como prueba de aprobación.

Los callbacks se serializan con un bloqueo temporal persistido y la confirmación se valida contra monto, orden y sesión. Un pago aprobado no se degrada por un callback repetido. Las claves de idempotencia se reutilizan para el mismo carrito/datos; un carrito distinto es una compra distinta. El límite de creación es de 20 intentos/hora por IP seudonimizada en Vercel.

Si el comprador cierra la pestaña antes de retornar, no habrá confirmación automática en segundo plano: revisar transacciones pendientes y reconciliar con Transbank antes de despachar. La consulta está disponible en el comprobante y para operación manual; no hay cron de conciliación ni reembolsos automáticos en esta entrega. Cancelar un despacho en el panel NO reembolsa el pago.

El administrador puede eliminar un pedido con confirmación de su número. La operación `admin_delete_order` borra atómicamente `webpay_transactions`, `order_items` y `orders`; no modifica cuentas, catálogo, imágenes compartidas, respaldos ni registros en Transbank, y NO reembolsa dinero. Se bloquea mientras el pago se está verificando o existe un pago productivo pendiente. Exportar/conservar los antecedentes necesarios antes de eliminar un pago real autorizado: el comprobante de la tienda deja de estar disponible. Los pedidos no tienen archivos propios almacenados en Vercel ni Supabase Storage; la tienda consulta la base de datos en cada solicitud autenticada y los contadores del panel se actualizan al eliminar.

## Referencias oficiales

- [Flujo Webpay Plus](https://transbankdevelopers.cl/documentacion/webpay-plus)
- [API y credenciales](https://transbankdevelopers.cl/referencia/webpay)
- [Documentación oficial en GitHub](https://github.com/TransbankDevelopers/transbank-developers-docs/tree/master/referencia/webpay)
