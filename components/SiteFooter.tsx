import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

function ContactIcon({ type }: { type: "pin" | "mail" | "clock" }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.447 4.434-9.889 9.9-9.889 2.642 0 5.126 1.03 6.993 2.898a9.825 9.825 0 0 1 2.9 6.994c-.003 5.448-4.445 9.89-9.909 9.89m8.419-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.3-1.652a11.867 11.867 0 0 0 5.688 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.466 3.48Z"/></svg>;
}

export async function SiteFooter() {
  const supabase = await createClient();
  const [{ data: settings }, { data: footerSettings }, { data: footerSections }, { data: footerLinks }] = await Promise.all([
    supabase.from("store_settings").select("whatsapp_number,instagram_url,instagram_active,facebook_url,facebook_active,youtube_url,youtube_active").eq("id", true).maybeSingle(),
    supabase.from("footer_settings").select("business_name,location_text,contact_email,service_text,service_hours").eq("id", true).maybeSingle(),
    supabase.from("footer_sections").select("section_key,title,sort_order").eq("active", true).order("sort_order"),
    supabase.from("footer_links").select("id,section_key,label,href,sort_order").eq("active", true).order("sort_order"),
  ]);
  const socials = [
    { label: "Instagram", url: settings?.instagram_url, active: settings?.instagram_active, icon: "/images/brands/instagram.svg", width: 24, height: 24 },
    { label: "Facebook", url: settings?.facebook_url, active: settings?.facebook_active, icon: "/images/brands/facebook.svg", width: 24, height: 24 },
    { label: "YouTube", url: settings?.youtube_url, active: settings?.youtube_active, icon: "/images/brands/youtube.svg", width: 28, height: 22 },
  ].filter((social) => social.active && social.url);
  const whatsappDigits = (settings?.whatsapp_number ?? "").replace(/\D/g, "");
  const whatsappNumber = whatsappDigits.length === 9 && whatsappDigits.startsWith("9") ? `56${whatsappDigits}` : whatsappDigits;
  const whatsappMessage = encodeURIComponent("Hola DMaestros, quisiera realizar una consulta.");
  return (
    <footer className="site-footer">
      <div className={`footer-main footer-directory${socials.length > 0 ? " has-socials" : ""}`}>
        <section className="footer-contact-column">
          <h2>{footerSettings?.business_name ?? "DMaestros Chile"}</h2>
          <p><ContactIcon type="pin" /><span>{footerSettings?.location_text ?? "Taller de productos artesanales fabricados en Chile"}</span></p>
          <a href={`mailto:${footerSettings?.contact_email ?? "contacto@dmaestros.cl"}`}><ContactIcon type="mail" /><span>{footerSettings?.contact_email ?? "contacto@dmaestros.cl"}</span></a>
          <p><ContactIcon type="clock" /><span>{footerSettings?.service_text ?? "Atención personalizada"}<br/><small>{footerSettings?.service_hours ?? "Lunes a viernes"}</small></span></p>
        </section>
        {(footerSections ?? []).map((section) => <nav className="footer-column" aria-label={section.title} key={section.section_key}><h2>{section.title}</h2>{(footerLinks ?? []).filter((link) => link.section_key === section.section_key).map((link) => link.href.startsWith("/") ? <Link href={link.href} key={link.id}>{link.label}</Link> : <a href={link.href} key={link.id} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>{link.label}</a>)}</nav>)}

        {socials.length > 0 && <section className="footer-social-column">
          <h2>Síguenos</h2>
          <div className="footer-socials" aria-label="Redes sociales">
            {socials.map((social) => <a key={social.label} href={social.url!} target="_blank" rel="noreferrer" aria-label={social.label}><Image src={social.icon} alt={social.label} width={social.width} height={social.height} /></a>)}
          </div>
        </section>}
      </div>

      <div className="footer-bottom">
        <p><span aria-hidden="true">©</span> {new Date().getFullYear()} DMaestros Chile. Todos los derechos reservados.</p>
        <div className="payment-methods" aria-label="Medios de pago">
          <span className="webpay-plus-badge"><Image src="/images/brands/webpay-plus.jpg" alt="Webpay Plus de Transbank" width={96} height={96} /></span>
          <span><Image src="/images/brands/mastercard.svg" alt="Mastercard" width={38} height={24} /></span>
          <span><Image src="/images/brands/visa.svg" alt="Visa" width={55} height={20} /></span>
          <span><Image src="/images/brands/americanexpress.svg" alt="American Express" width={31} height={25} /></span>
        </div>
      </div>
      {whatsappNumber && <a className="floating-whatsapp" href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" aria-label="Contactar a DMaestros por WhatsApp" title="Escríbenos por WhatsApp"><span className="floating-whatsapp-wave wave-one" aria-hidden="true" /><span className="floating-whatsapp-wave wave-two" aria-hidden="true" /><span className="floating-whatsapp-wave wave-three" aria-hidden="true" /><WhatsAppIcon /><span className="floating-whatsapp-label" aria-hidden="true">¿Necesitas ayuda?</span></a>}
    </footer>
  );
}
