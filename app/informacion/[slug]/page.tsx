import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("footer_links").select("label,page_content,section_key").eq("slug", slug).eq("active", true).maybeSingle();
  if (!data) notFound();
  return <main className="information-page">
    <nav className="information-breadcrumb" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden="true">/</span><span>{data.label}</span></nav>
    <header className="information-heading"><span>{data.section_key === "about" ? "Hecho en Chile · DMaestros" : "Información DMaestros"}</span><h1>{data.label}</h1></header>
    <article className="information-body">{(data.page_content || "Para más información sobre esta sección, comunícate con nuestro equipo.").split(/\n{2,}/).map((paragraph: string, index: number) => paragraph.startsWith("## ") ? <h2 key={index}>{paragraph.slice(3)}</h2> : <p key={index}>{paragraph}</p>)}</article>
    <aside className="information-next"><div><h2>Encuentra una pieza para tu espacio</h2><p>Explora nuestras colecciones o conversemos sobre lo que tienes en mente.</p></div><Link className="information-button" href="/tienda">Explorar la tienda</Link>{slug !== "contacto" && <Link className="information-contact" href="/informacion/contacto">Contactar al equipo</Link>}</aside>
  </main>;
}
