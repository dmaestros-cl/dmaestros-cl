with catalog (sku, name, image_url, category_name) as (values
  ('DM-M01', 'Cava bar ovalada de madera', '/images/products/cava-ovalada.png', 'Cavas y bares'),
  ('DM-M02', 'Mueble TV mural listonado', '/images/products/mueble-tv-mural.png', 'Muebles'),
  ('DM-M03', 'Rack aparador listonado con cajones', '/images/products/rack-aparador-listonado.png', 'Muebles'),
  ('DM-M04', 'Centro de entretenimiento modular', '/images/products/centro-entretenimiento.png', 'Muebles'),
  ('DM-M05', 'Buffet listonado de madera', '/images/products/buffet-listonado.png', 'Muebles'),
  ('DM-M06', 'Buffet clásico de cuatro puertas', '/images/products/buffet-cuatro-puertas.png', 'Muebles'),
  ('DM-C01', 'Caja para corchos · El vino mejora con la edad', '/images/products/caja-vino-mejora-edad.png', 'Cajas para corchos'),
  ('DM-C02', 'Caja para corchos · El mejor vino se comparte', '/images/products/caja-mejor-vino-compania.png', 'Cajas para corchos'),
  ('DM-C03', 'Caja para corchos · Ven, yo invito al vino', '/images/products/caja-yo-invito-vino.png', 'Cajas para corchos'),
  ('DM-C04', 'Caja para corchos · Momentos inolvidables', '/images/products/caja-corchos-momentos.png', 'Cajas para corchos'),
  ('DM-C05', 'Caja para corchos · Testigo de buenos momentos', '/images/products/caja-corchos-testigo.png', 'Cajas para corchos'),
  ('DM-C06', 'Caja mixta para tapas y corchos · Salucita', '/images/products/caja-mixta-salucita.png', 'Cajas mixtas'),
  ('DM-C07', 'Caja coleccionadora para cerveza y vino', '/images/products/caja-cerveza-vino.png', 'Cajas mixtas'),
  ('DM-J01', 'Juego destapador de cerveza · Nogal', '/images/products/juego-cerveza-nogal-vertical.png', 'Juegos de cerveza'),
  ('DM-J02', 'Juego destapador de cerveza · Natural', '/images/products/juego-cerveza-natural-vertical.png', 'Juegos de cerveza'),
  ('DM-J03', 'El juego de la cerveza · Nogal', '/images/products/juego-cerveza-nogal.png', 'Juegos de cerveza'),
  ('DM-J04', 'El juego de la cerveza · Natural', '/images/products/juego-cerveza-natural.png', 'Juegos de cerveza'),
  ('DM-B01', 'Mueble Coffee Bar iluminado', '/images/products/coffee-bar-iluminado.png', 'Coffee Bar'),
  ('DM-B02', 'Estación de café DMaestros', '/images/products/estacion-cafe.png', 'Coffee Bar'),
  ('DM-D01', 'Caja decorativa vitrina de roble', '/images/products/caja-decorativa-vitrina.webp', 'Cajas decorativas'),
  ('DM-E01', 'Caja de juegos clásicos en nogal', '/images/products/caja-juegos-clasicos.webp', 'Cajas de entretención'),
  ('DM-L01', 'Caballo balancín artesanal', '/images/products/caballo-balancin-madera.webp', 'Juguete lúdico decorativo'),
  ('DM-CM01', 'Comedor de roble nativo para cuatro personas', '/images/products/comedor-roble-nativo.webp', 'Comedores'),
  ('DM-P01', 'Cama curva de roble para mascotas', '/images/products/cama-mascota-roble.webp', 'Mascotas')
)
insert into public.products (sku, name, image_url, category_id, stock, active)
select catalog.sku, catalog.name, catalog.image_url, categories.id, 0, true
from catalog
join public.categories on categories.name = catalog.category_name
on conflict (sku) do nothing;
