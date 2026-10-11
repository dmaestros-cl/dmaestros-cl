update public.footer_links set page_content=case slug
when 'formas-de-pago' then $content$Queremos que puedas revisar tu compra con claridad antes de confirmarla. En el proceso de compra se presenta el resumen de productos, sus cantidades y el total correspondiente.

## Confirmación y coordinación

Al registrar tu pedido, sigue las indicaciones que aparecen en la confirmación. Nuestro equipo se pondrá en contacto para coordinar el pago según las opciones disponibles para tu compra. Si se trata de una pieza por encargo, las condiciones se informan al preparar la cotización.

## Revisa antes de pagar

Comprueba los productos, los datos de contacto y la modalidad de entrega. Ante una diferencia en el resumen o una duda sobre el pago, consulta al equipo antes de realizarlo.

## Ayuda con tu compra

Para consultar por un pago, indica el número de pedido y el correo utilizado al comprar. No compartas contraseñas ni datos completos de tu tarjeta por correo o WhatsApp.$content$
when 'despachos' then $content$La modalidad de entrega depende del producto y de la ubicación de destino. Revisa las opciones disponibles durante la compra y confirma que tus datos sean correctos para facilitar la coordinación.

## Destino y costo de entrega

Al completar el pedido, selecciona la región y comuna e ingresa una dirección detallada. El resumen muestra el costo de despacho cuando existe una tarifa disponible para el destino seleccionado. Algunos productos pueden requerir retiro o una coordinación particular.

## Preparación y entrega

La disponibilidad de la pieza, su tamaño y la modalidad de entrega pueden influir en la coordinación del pedido. Para conocer un plazo o solicitar una fecha específica, consulta al equipo antes de confirmar la compra. Los productos por encargo requieren confirmar sus condiciones al cotizar.

## Seguimiento y recepción

Puedes revisar tus pedidos en Mi Cuenta. Al recibir una pieza, revisa su estado y conserva la información del pedido. Si detectas una incidencia en la entrega, comunícate con nosotros e incluye fotografías que permitan revisarla.$content$
when 'cambios-y-devoluciones' then $content$Si tienes una consulta sobre un cambio, devolución o incidencia con una compra, nuestro equipo puede ayudarte a revisar el caso y los pasos que correspondan. Esta página describe el canal de atención y no limita los derechos que resulten aplicables a tu compra.

## Cómo iniciar una solicitud

Escríbenos por los canales indicados en el pie de página. Incluye el número de pedido, el correo utilizado al comprar, el producto y el motivo de la solicitud. Si hay un problema con la pieza, adjunta fotografías claras y una descripción de lo ocurrido.

## Coordinación del proceso

El equipo revisará la información y te comunicará cómo continuar. Antes de enviar o trasladar el producto, confirma el destino y la modalidad de recepción para evitar entregas sin coordinación.

## Piezas personalizadas

Para un trabajo por encargo, conserva la cotización y las especificaciones acordadas. Las solicitudes se revisan considerando las características del pedido y las condiciones comunicadas al contratarlo, junto con los derechos que correspondan.$content$
when 'garantia' then $content$Si una pieza presenta un problema, queremos conocerlo y ayudarte a revisar la situación. Conserva la información de tu compra y comunícate con nuestro equipo para recibir orientación sobre el procedimiento aplicable.

## Información para evaluar el caso

Indica el número de pedido, el producto y cuándo detectaste el problema. Describe su uso y adjunta fotografías generales y de detalle. Estos antecedentes permiten comprender la incidencia y coordinar los siguientes pasos.

## Materiales naturales y cuidado

La madera puede presentar variaciones de veta y tono entre piezas. Para consultas sobre terminaciones, mantenimiento o una característica que te genere dudas, escríbenos. Si necesitas instrucciones de cuidado para un producto concreto, solicítalas al equipo.

## Atención y condiciones

Antes de coordinar una revisión o entrega del producto, confirma el procedimiento con nosotros. Las condiciones particulares informadas para una pieza y los derechos que resulten aplicables a la compra se consideran al atender cada solicitud.$content$
when 'todos-los-productos' then $content$Descubre el catálogo de DMaestros en un solo lugar. Reunimos muebles y objetos artesanales en madera para decorar, organizar y disfrutar distintos espacios de tu hogar.

## Explora por colección

En la tienda puedes filtrar por categoría y buscar las piezas que se ajustan a lo que necesitas. Abre cada ficha para revisar sus fotografías, descripción e información disponible.

## Compra o solicita una cotización

Las acciones de cada producto indican si puedes comprarlo directamente o consultar por una propuesta. Para piezas por encargo, medidas especiales o dudas sobre disponibilidad, conversa con nuestro equipo antes de confirmar.

## Encuentra tu próxima pieza

Utiliza el botón Explorar la tienda de esta página para acceder al catálogo completo. Si buscas algo específico y no lo encuentras, escríbenos con una referencia de tu idea.$content$
when 'personalizaciones' then $content$Una pieza personalizada comienza con una conversación. Si buscas adaptar una propuesta o desarrollar un objeto para un espacio particular, cuéntanos tu idea para evaluar las posibilidades del taller.

## Comparte lo que necesitas

Indica el tipo de pieza, las medidas aproximadas, la cantidad y el uso previsto. Las fotografías del espacio y las referencias de estilo ayudan a definir una propuesta. Si tienes una fecha en mente, inclúyela en la consulta.

## Viabilidad y propuesta

Nuestro equipo revisa los materiales, las terminaciones y las alternativas que puede ofrecer. Las posibilidades de personalización dependen de cada proyecto; el alcance, valor y condiciones de entrega se confirman al cotizar.

## Detalles acordados antes de comenzar

Revisa la propuesta y confirma las especificaciones antes de encargar el trabajo. Si necesitas modificar una medida o característica, consulta su viabilidad con el equipo para actualizar las condiciones del proyecto.$content$
end
where section_key='information' and slug in ('formas-de-pago','despachos','cambios-y-devoluciones','garantia','todos-los-productos','personalizaciones')
and (coalesce(trim(page_content),'')='' or trim(page_content)='Contenido próximamente.');
