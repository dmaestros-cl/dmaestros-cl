-- Seed only empty pages; preserve content already edited by the administrator.
update public.footer_links set page_content=case slug
when 'conoce-dmaestros' then $content$En DMaestros creamos muebles, juguetes y objetos decorativos en madera para acompañar la vida cotidiana. Somos un taller de productos artesanales fabricados en Chile, donde cada pieza combina utilidad, diseño y el carácter propio de los materiales naturales.

## Piezas con identidad

Nos inspira la madera: sus vetas, sus tonos y las pequeñas diferencias que hacen especial a cada objeto. Buscamos que nuestras creaciones encuentren su lugar en el hogar, ya sea como un mueble protagonista, un detalle decorativo o un regalo con significado.

## Una relación cercana

Queremos que elegir una pieza sea una experiencia clara y personal. Puedes explorar las colecciones disponibles o conversar con nuestro equipo sobre medidas, usos y posibilidades de personalización antes de tomar una decisión.

## Del taller a tu espacio

Conoce nuestras propuestas y encuentra una pieza que dialogue con tu estilo. Para proyectos especiales, escríbenos: revisaremos contigo la idea y las opciones que podemos ofrecer.$content$
when 'nuestro-oficio' then $content$Nuestro oficio parte de una idea sencilla: dar forma a la madera para crear objetos que se disfruten y se utilicen. El trabajo artesanal permite atender los detalles y reconocer la singularidad de cada material.

## Diseño pensado para el uso

La forma y la función van de la mano. Consideramos cómo se integra una pieza en el espacio, cómo se manipula y qué aporta a la experiencia de quien la elige. Desde muebles hasta objetos de entretención, cada propuesta responde a un uso concreto.

## El carácter de la madera

Las vetas y variaciones de tono son parte de la identidad de una pieza natural. Por eso, las fotografías sirven como referencia: la apariencia puede variar entre productos elaborados con el mismo material.

## Conversar antes de crear

Si buscas una medida, terminación o diseño particular, cuéntanos lo que necesitas. Evaluamos cada solicitud y confirmamos su alcance, valor y condiciones antes de comenzar un proyecto.$content$
when 'productos' then $content$Nuestra tienda reúne muebles, objetos decorativos y piezas para compartir momentos en casa. Explora las categorías para encontrar propuestas de organización, decoración y entretención elaboradas en madera.

## Elige con información

En la ficha de cada producto puedes revisar las imágenes y la información disponible. Según la pieza, encontrarás opciones de compra directa o de cotización. Si necesitas confirmar una característica, nuestro equipo puede orientarte antes de comprar.

## Colecciones para distintos espacios

Descubre muebles, comedores, cavas y bares, cajas para corchos y otras colecciones del catálogo. Las categorías de la tienda permiten filtrar las piezas y comparar alternativas de acuerdo con lo que buscas.

## Una propuesta a tu medida

Para productos por encargo o solicitudes especiales, conversemos sobre el uso, las medidas y el estilo. La disponibilidad y las condiciones de cada propuesta se confirman al cotizar.$content$
when 'cotizaciones' then $content$Si tienes una idea para tu hogar, un regalo especial o un proyecto que requiere medidas particulares, podemos ayudarte a evaluar las opciones. Cada solicitud se revisa de acuerdo con sus características y la disponibilidad del taller.

## Cuéntanos tu idea

Para preparar una propuesta, comparte el tipo de pieza que buscas, las medidas aproximadas, la cantidad y el uso que tendrá. Puedes acompañar tu consulta con fotografías o referencias visuales y señalar si tienes una fecha en mente.

## Una propuesta clara

Antes de confirmar un trabajo, revisamos contigo el alcance, los materiales o terminaciones disponibles, el valor y las condiciones de entrega. Los plazos y las posibilidades de personalización se acuerdan para cada proyecto.

## Cómo solicitarla

Utiliza el botón de WhatsApp del sitio o la opción Cotizar en la ficha del producto. También puedes escribirnos desde la página Contacto. Nuestro equipo retomará tu consulta para completar la información necesaria.$content$
when 'contacto' then $content$Estamos para ayudarte a elegir una pieza, resolver dudas sobre el catálogo o conversar sobre un pedido especial. Una consulta con información clara nos permite orientarte mejor.

## Hablemos de tu proyecto

Puedes escribirnos a través del botón de WhatsApp disponible en el sitio o al correo indicado en el pie de página. Para cotizaciones, incluye medidas, cantidad y referencias de lo que necesitas.

## Consultas sobre pedidos

Si ya realizaste una compra, indica el número de pedido y el correo utilizado al comprar. Puedes revisar tus pedidos en Mi Cuenta y contactar al equipo para aclarar dudas sobre su preparación o entrega.

## Horarios y atención

Consulta los días y horarios actualizados en el pie de página. Si deseas coordinar una visita o un retiro, confirma previamente con nuestro equipo la dirección y disponibilidad.$content$
end
where section_key='about' and slug in ('conoce-dmaestros','nuestro-oficio','productos','cotizaciones','contacto')
and (coalesce(trim(page_content),'')='' or trim(page_content)='Contenido próximamente.');
