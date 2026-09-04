"use client";

import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { products, type CatalogProduct } from "@/lib/catalog";

const productBySku = new Map(products.map((product) => [product.sku, product]));

const extraProducts: Record<string, CatalogProduct> = {
  "DM-CM02": { sku: "DM-CM02", name: "Mesa artesanal de madera nativa", image: "/images/products/table.webp", category: "Comedores" },
  "DM-P02": { sku: "DM-P02", name: "Mueble artesanal para mascotas", image: "/images/hero/mascotas-artesanal.png", category: "Mascotas" },
};

function selectProducts(...skus: string[]) {
  return skus.map((sku) => productBySku.get(sku) ?? extraProducts[sku]).filter(Boolean) as CatalogProduct[];
}

const categorySections = [
  { title: "Cajas decorativas", description: "Diseñadas para momentos y objetos que valoras.", href: "/tienda?categoria=Cajas%20decorativas#catalogo", images: ["/images/banners/cajas-decorativas-premium.png", "/images/hero/mobile-cajas-decorativas-v4.webp"], products: selectProducts("DM-D01", "DM-C04") },
  { title: "Cajas de entretención", description: "Diseñadas para compartir y guardar momentos.", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo", images: ["/images/banners/cajas-entretencion-premium.png", "/images/hero/mobile-cajas-entretencion-v4.webp"], products: selectProducts("DM-E01", "DM-J03") },
  { title: "Juguete lúdico decorativo", description: "Diseños originales para el niño o niña que llevas dentro.", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo", images: ["/images/hero/juguete-ludico.webp", "/images/hero/mobile-juguete-ludico-v4.webp"], products: selectProducts("DM-L01", "DM-E01") },
  { title: "Muebles", description: "Diseños que aportan estilo y originalidad a tus espacios.", href: "/tienda?categoria=Muebles#catalogo", images: ["/images/editorial/furniture.webp", "/images/hero/mobile-muebles-v4.webp"], products: selectProducts("DM-M02", "DM-M03") },
  { title: "Comedores", description: "Modernos diseños con estilo y personalidad para tu hogar. Fabricados en maderas nativas.", href: "/tienda?categoria=Comedores#catalogo", images: ["/images/hero/comedor-artesanal.webp", "/images/hero/mobile-comedores-v4.webp"], products: selectProducts("DM-CM01", "DM-CM02") },
  { title: "Mascotas", description: "Porque nuestras mascotas también necesitan estilo y elegancia.", href: "/tienda?categoria=Mascotas#catalogo", images: ["/images/hero/mascotas-artesanal.webp", "/images/hero/mobile-mascotas-v4.webp"], products: selectProducts("DM-P01", "DM-P02") },
  { title: "Pedidos especiales", description: "Tu mueble ideal lo hacemos realidad.", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial", images: ["/images/banners/pedidos-especiales-premium.png", "/images/hero/mobile-pedidos-especiales-v4.webp"], products: selectProducts("DM-M05", "DM-M06") },
] as const;

export function HomeCategoryShowcase() {
  const { addToCart } = useCart();

  return (
    <section className="home-showcase" aria-label="Colecciones DMaestros">
      {categorySections.map((category) => (
        <article className="category-showcase-section" key={category.title}>
          <header className="category-showcase-heading">
            <div>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </div>
          </header>

          <div className="home-category-pair">
            {category.images.map((image, imageIndex) => (
              <a className="home-category-tile" href={category.href} key={image}>
                <Image className="home-category-image" src={image} alt={`${category.title}, vista ${imageIndex + 1}`} fill sizes="(max-width: 899px) 50vw, 50vw" />
                <span>{imageIndex === 0 ? category.title : "Descubrir colección"}</span>
              </a>
            ))}
          </div>

          <div className="category-products-label">
            <h3>Productos de la categoría</h3>
            <a href={category.href}>Ver categoría <span aria-hidden="true">→</span></a>
          </div>

          <div className="home-product-carousel" aria-label={`Productos de ${category.title}`}>
            {category.products.map((product) => (
              <article className="home-product-card" key={`${category.title}-${product.sku}`}>
                <a className="home-product-photo" href={`/tienda?categoria=${encodeURIComponent(category.title)}#catalogo`}>
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 899px) 50vw, 320px" />
                </a>
                <p>{product.sku}</p>
                <h4>{product.name}</h4>
                <button className="home-product-buy" type="button" onClick={() => addToCart(product)}>Comprar</button>
              </article>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
