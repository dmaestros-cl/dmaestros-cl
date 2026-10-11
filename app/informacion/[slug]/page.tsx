import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("footer_links").select("label,page_content").eq("slug", slug).eq("active", true).maybeSingle();
  if (!data) notFound();
  return <main className="information-page"><span>Información DMaestros</span><h1>{data.label}</h1><div>{(data.page_content || "Contenido próximamente.").split(/\n{2,}/).map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}</div></main>;
}
