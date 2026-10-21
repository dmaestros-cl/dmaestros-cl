export type HeroSlide = {
  mobileImage: string;
  desktopImage: string;
  mobileSize?: { width: number; height: number };
  desktopSize?: { width: number; height: number };
  alt: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

// Fuente única del hero. El panel de Configuración podrá reemplazar esta lista
// por los registros administrables sin modificar el componente visual.
export const heroSlides: HeroSlide[] = [
  {
    mobileImage: "https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-mobile-v1.webp",
    desktopImage: "https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-desktop-v1.webp",
    alt: "Colección de juguetes espaciales artesanales sobre un mueble de madera",
    title: "Creamos piezas que forman parte de tu vida",
    description: "Muebles, juguetes y decoración en maderas nobles, hechos a mano con dedicación y pasión.",
    cta: "Conoce nuestras piezas",
    href: "/tienda",
  },
];
