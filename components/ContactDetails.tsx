import { createClient } from "@/lib/supabase/server";
import styles from "./ContactDetails.module.css";

function ContactDetailIcon({ type }: { type: "mail" | "message" | "pin" | "clock" }) {
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    message: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
  };
  return <span className={styles.icon}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></span>;
}

function formatHours(open: string | null, close: string | null) {
  return open && close ? `${open.slice(0, 5)} – ${close.slice(0, 5)}` : "Horario por confirmar";
}

export async function ContactDetails() {
  const supabase = await createClient();
  // Read the same public settings edited in Admin: Footer and Sales / WhatsApp.
  // No persistent cache: each page request reads the current saved values.
  const [contactResult, storeResult] = await Promise.all([
    supabase.from("footer_settings").select("business_name,location_text,contact_email,service_text,weekday_open,weekday_close,saturday_active,saturday_open,saturday_close,sunday_active,sunday_open,sunday_close").eq("id", true).maybeSingle(),
    supabase.from("store_settings").select("whatsapp_number").eq("id", true).maybeSingle(),
  ]);
  const contact = contactResult.data;
  const digits = (storeResult.data?.whatsapp_number ?? "").replace(/\D/g, "");
  const whatsappNumber = digits.length === 9 && digits.startsWith("9") ? `56${digits}` : digits;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola DMaestros, quisiera realizar una consulta.")}`;
  const email = contact?.contact_email?.trim();
  const location = contact?.location_text?.trim();

  if (contactResult.error || storeResult.error) {
    console.error("Could not load public contact settings", { footer: contactResult.error?.code, store: storeResult.error?.code });
  }

  return <section className={styles.section} aria-label="Datos de contacto">
    <header className={styles.heading}>
      <h2>{contact?.business_name || "Conversemos"}</h2>
      {contact?.service_text && <p>{contact.service_text}</p>}
    </header>
    <div className={styles.grid}>
      {email && <article className={styles.card}>
        <ContactDetailIcon type="mail" />
        <div><h3>Correo electrónico</h3><a className={styles.email} href={`mailto:${email}`}>{email}</a><p>Consultas, cotizaciones y pedidos especiales.</p></div>
      </article>}
      {whatsappNumber && <article className={styles.card}>
        <ContactDetailIcon type="message" />
        <div><h3>WhatsApp</h3><p className={styles.number}>+{whatsappNumber}</p><a className={styles.whatsapp} href={whatsappHref} target="_blank" rel="noreferrer">Escribir por WhatsApp <span aria-hidden="true">↗</span></a></div>
      </article>}
      {location && <article className={styles.card}>
        <ContactDetailIcon type="pin" />
        <div><h3>Ubicación</h3><p className={styles.location}>{location}</p></div>
      </article>}
      {contact && <article className={styles.card}>
        <ContactDetailIcon type="clock" />
        <div><h3>Horario de atención</h3><dl className={styles.hours}>
          <div><dt>Lunes a viernes</dt><dd>{formatHours(contact.weekday_open, contact.weekday_close)}</dd></div>
          <div><dt>Sábado</dt><dd>{contact.saturday_active ? formatHours(contact.saturday_open, contact.saturday_close) : "Cerrado"}</dd></div>
          <div><dt>Domingo</dt><dd>{contact.sunday_active ? formatHours(contact.sunday_open, contact.sunday_close) : "Cerrado"}</dd></div>
        </dl></div>
      </article>}
    </div>
    {(contactResult.error || storeResult.error || (!contact && !whatsappNumber)) && <p className={styles.notice} role="status">No pudimos cargar todos los datos de contacto. Vuelve a cargar esta página en unos momentos.</p>}
  </section>;
}
