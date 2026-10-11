import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const sender = process.env.EMAIL_FROM ?? "DMaestros <ventas@dmaestros.cl>";
  if (!apiKey || !adminEmail) return NextResponse.json({ error: "Correo no configurado" }, { status: 503 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [adminEmail],
      subject: "Contraseña de cliente actualizada",
      html: `<div style="font-family:Arial,sans-serif;color:#17394d"><h2>Actualización de seguridad</h2><p>La cuenta <strong>${user.email.replace(/[<>&"']/g, "")}</strong> actualizó correctamente su contraseña.</p><p style="color:#71818a;font-size:13px">Este mensaje es informativo. La contraseña nunca es visible ni almacenada en el correo.</p></div>`,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "No fue posible enviar la notificación" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
