import Link from "next/link";
import Image from "next/image";

const whatsappUrl = "https://wa.me/?text=Hola%20DMaestros%2C%20quiero%20hacer%20una%20consulta.";

function ContactIcon({ type }: { type: "pin" | "phone" | "mail" | "clock" }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></>,
    phone: <path d="M5 3h4l2 5-3 2c1.5 3 3 4.5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main footer-directory">
        <section className="footer-contact-column">
          <h2>DMaestros Chile</h2>
          <p><ContactIcon type="pin" /><span>Taller de productos artesanales<br/>fabricados en Chile</span></p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><ContactIcon type="phone" /><span>Escríbenos por WhatsApp</span></a>
          <a href="mailto:contacto@dmaestros.cl"><ContactIcon type="mail" /><span>contacto@dmaestros.cl</span></a>
          <p><ContactIcon type="clock" /><span>Atención personalizada<br/><small>Lunes a viernes</small></span></p>
        </section>

        <nav className="footer-column" aria-label="Colecciones">
          <h2>Colecciones</h2>
          <Link href="/#productos">Destapadores de cerveza</Link>
          <Link href="/#productos">Cajas para tapas</Link>
          <Link href="/#productos">Cajas para corchos</Link>
          <Link href="/#productos-bar">Juegos de cerveza</Link>
          <Link href="/#productos-bar">Coffee Bar</Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Pedidos especiales</a>
        </nav>

        <nav className="footer-column" aria-label="DMaestros">
          <h2>Quiénes somos</h2>
          <Link href="/#inicio">Conoce DMaestros</Link>
          <Link href="/#muebles">Nuestro oficio</Link>
          <Link href="/tienda">Productos</Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cotizaciones</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Contacto</a>
          <h2 className="footer-subheading">Mi cuenta</h2>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Mis consultas</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Mis pedidos</a>
        </nav>

        <nav className="footer-column" aria-label="Información">
          <h2>Información</h2>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Formas de pago</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Despachos</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cambios y devoluciones</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Garantía</a>
          <Link href="/tienda">Todos los productos</Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Personalizaciones</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </nav>

        <section className="footer-social-column">
          <h2>Síguenos</h2>
          <div className="footer-socials" aria-label="Redes sociales">
            <a href="#inicio" aria-label="Instagram"><Image src="/images/brands/instagram.svg" alt="Instagram" width={24} height={24} /></a>
            <a href="#inicio" aria-label="Facebook"><Image src="/images/brands/facebook.svg" alt="Facebook" width={24} height={24} /></a>
            <a href="#inicio" aria-label="YouTube"><Image src="/images/brands/youtube.svg" alt="YouTube" width={28} height={22} /></a>
          </div>
          <a className="footer-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Image src="/images/brands/whatsapp.svg" alt="WhatsApp" width={28} height={28} /></a>
        </section>
      </div>

      <div className="footer-bottom">
        <p><span aria-hidden="true">©</span> Copyright {new Date().getFullYear()} DMaestros. Todos los derechos reservados.</p>
        <div className="payment-methods" aria-label="Medios de pago">
          <span><Image src="/images/brands/mercadopago.svg" alt="Mercado Pago" width={74} height={25} /></span>
          <span><Image src="/images/brands/mastercard.svg" alt="Mastercard" width={38} height={24} /></span>
          <span><Image src="/images/brands/visa.svg" alt="Visa" width={55} height={20} /></span>
          <span><Image src="/images/brands/americanexpress.svg" alt="American Express" width={31} height={25} /></span>
        </div>
      </div>
    </footer>
  );
}
