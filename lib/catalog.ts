export type CatalogProduct = {
  sku: string;
  name: string;
  image: string;
  category: string;
  price?: number;
};

export const products: readonly CatalogProduct[] = [
  { sku: "DM-M01", name: "Cava bar ovalada de madera", image: "/images/products/cava-ovalada.png", category: "Cavas y bares" },
  { sku: "DM-M02", name: "Mueble TV mural listonado", image: "/images/products/mueble-tv-mural.png", category: "Muebles" },
  { sku: "DM-M03", name: "Rack aparador listonado con cajones", image: "/images/products/rack-aparador-listonado.png", category: "Muebles" },
  { sku: "DM-M04", name: "Centro de entretenimiento modular", image: "/images/products/centro-entretenimiento.png", category: "Muebles" },
  { sku: "DM-M05", name: "Buffet listonado de madera", image: "/images/products/buffet-listonado.png", category: "Muebles" },
  { sku: "DM-M06", name: "Buffet clásico de cuatro puertas", image: "/images/products/buffet-cuatro-puertas.png", category: "Muebles" },
  { sku: "DM-C01", name: "Caja para corchos · El vino mejora con la edad", image: "/images/products/caja-vino-mejora-edad.png", category: "Cajas para corchos" },
  { sku: "DM-C02", name: "Caja para corchos · El mejor vino se comparte", image: "/images/products/caja-mejor-vino-compania.png", category: "Cajas para corchos" },
  { sku: "DM-C03", name: "Caja para corchos · Ven, yo invito al vino", image: "/images/products/caja-yo-invito-vino.png", category: "Cajas para corchos" },
  { sku: "DM-C04", name: "Caja para corchos · Momentos inolvidables", image: "/images/products/caja-corchos-momentos.png", category: "Cajas para corchos" },
  { sku: "DM-C05", name: "Caja para corchos · Testigo de buenos momentos", image: "/images/products/caja-corchos-testigo.png", category: "Cajas para corchos" },
  { sku: "DM-C06", name: "Caja mixta para tapas y corchos · Salucita", image: "/images/products/caja-mixta-salucita.png", category: "Cajas mixtas" },
  { sku: "DM-C07", name: "Caja coleccionadora para cerveza y vino", image: "/images/products/caja-cerveza-vino.png", category: "Cajas mixtas" },
  { sku: "DM-J01", name: "Juego destapador de cerveza · Nogal", image: "/images/products/juego-cerveza-nogal-vertical.png", category: "Juegos de cerveza" },
  { sku: "DM-J02", name: "Juego destapador de cerveza · Natural", image: "/images/products/juego-cerveza-natural-vertical.png", category: "Juegos de cerveza" },
  { sku: "DM-J03", name: "El juego de la cerveza · Nogal", image: "/images/products/juego-cerveza-nogal.png", category: "Juegos de cerveza" },
  { sku: "DM-J04", name: "El juego de la cerveza · Natural", image: "/images/products/juego-cerveza-natural.png", category: "Juegos de cerveza" },
  { sku: "DM-B01", name: "Mueble Coffee Bar iluminado", image: "/images/products/coffee-bar-iluminado.png", category: "Coffee Bar" },
  { sku: "DM-B02", name: "Estación de café DMaestros", image: "/images/products/estacion-cafe.png", category: "Coffee Bar" },
  { sku: "DM-D01", name: "Caja decorativa vitrina de roble", image: "/images/products/caja-decorativa-vitrina.webp", category: "Cajas decorativas" },
  { sku: "DM-E01", name: "Caja de juegos clásicos en nogal", image: "/images/products/caja-juegos-clasicos.webp", category: "Cajas de entretención" },
  { sku: "DM-L01", name: "Caballo balancín artesanal", image: "/images/products/caballo-balancin-madera.webp", category: "Juguete lúdico decorativo" },
  { sku: "DM-CM01", name: "Comedor de roble nativo para cuatro personas", image: "/images/products/comedor-roble-nativo.webp", category: "Comedores" },
  { sku: "DM-P01", name: "Cama curva de roble para mascotas", image: "/images/products/cama-mascota-roble.webp", category: "Mascotas" },
] as const;

export const categories = [
  "Muebles", "Comedores", "Cavas y bares", "Cajas para corchos", "Cajas mixtas",
  "Cajas decorativas", "Cajas de entretención", "Juegos de cerveza",
  "Juguete lúdico decorativo", "Coffee Bar", "Mascotas",
] as const;

export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}
