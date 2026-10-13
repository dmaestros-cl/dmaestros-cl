import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { WebpayCartSync } from "@/components/WebpayCartSync";
import { createPaymentClient } from "@/lib/supabase/payments";
import { RECEIPT_COOKIE } from "@/lib/webpay-payment";
import { UUID } from "@/lib/webpay-contract";

export const metadata: Metadata = { title: "Resultado del pago | DMaestros", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

async function getReceipt() {
  const receipt = (await cookies()).get(RECEIPT_COOKIE)?.value;
  if (!receipt || !UUID.test(receipt)) return null;
  try {
    const db = createPaymentClient();
    const { data, error } = await db.from("webpay_transactions")
      .select("id,receipt_id,order_id,buy_order,amount,state,environment,authorization_code,payment_type_code,card_last_four,installments_number,transaction_date,token")
      .eq("receipt_id", receipt).maybeSingle();
    if (error || !data) return null;
    const { data: lines, error: lineError } = data.state === "authorized"
      ? await db.from("order_items").select("sku,quantity").eq("order_id", data.order_id)
      : { data: null, error: null };
    return { ...data, paidLines: lineError ? null : lines };
  } catch { console.error("webpay_receipt_unavailable"); return null; }
}

export default async function PaymentResultPage() {
  const receipt = await getReceipt();
  if (receipt?.environment === "integration") {
    return <div className="shop-shell"><SiteHeader /><main className="checkout-page">
      <section className="webpay-receipt is-pending">
        <p className="webpay-receipt-kicker">Webpay Plus · Transbank</p>
        <h1>Operación no comercial</h1>
        <p>Este registro técnico no corresponde a una compra. No se realizó ningún cobro ni se generará un despacho.</p>
        <div className="webpay-receipt-actions"><Link href="/tienda">Volver a la tienda</Link></div>
      </section>
    </main></div>;
  }
  const paid = receipt?.state === "authorized";
  const finalFailure = receipt && ["failed", "cancelled", "expired"].includes(receipt.state);
  const unstarted = receipt?.state === "creating" && !receipt.token;
  const canRetry = Boolean(finalFailure || unstarted);
  const failureTitles: Record<string, string> = { failed: "Pago no aprobado", cancelled: "Pago cancelado", expired: "El tiempo de pago terminó" };
  const title = paid ? "Pago aprobado" : finalFailure ? (failureTitles[receipt.state] ?? "Pago no completado") : unstarted ? "No se inició el pago" : "Pago pendiente de verificación";
  const description = paid ? "Gracias por tu compra. Confirmamos el pago con Transbank y registramos tu pedido."
    : canRetry ? "Tu carrito se conserva. Puedes revisar tus productos e iniciar un nuevo intento de pago."
    : "Aún no podemos confirmar el resultado. Consulta el estado antes de intentar otro pago para evitar una compra duplicada.";
  const paymentTypes: Record<string, string> = { VD: "Débito", VP: "Prepago", VN: "Crédito", VC: "Crédito en cuotas", SI: "Crédito en cuotas", S2: "Crédito en cuotas", NC: "Crédito en cuotas" };
  return <div className="shop-shell"><SiteHeader /><main className="checkout-page">
    <section className={`webpay-receipt ${paid ? "is-approved" : "is-pending"}`}>
      <span className="webpay-receipt-icon" aria-hidden="true">{paid ? "✓" : "!"}</span>
      <p className="webpay-receipt-kicker">Webpay Plus · Transbank</p><h1>{title}</h1><p>{description}</p>
      {receipt && <dl>
        <div><dt>Orden de compra</dt><dd>{receipt.buy_order}</dd></div>
        <div><dt>{paid ? "Total pagado" : "Total del pedido"}</dt><dd>${Number(receipt.amount).toLocaleString("es-CL")} CLP</dd></div>
        {paid && <>
          <div><dt>Autorización</dt><dd>{receipt.authorization_code}</dd></div>
          <div><dt>Medio de pago</dt><dd>{paymentTypes[receipt.payment_type_code] ?? "Tarjeta"}{receipt.card_last_four ? ` · •••• ${receipt.card_last_four}` : ""}</dd></div>
          {receipt.installments_number > 0 && <div><dt>Cuotas</dt><dd>{receipt.installments_number}</dd></div>}
          {receipt.transaction_date && <div><dt>Fecha</dt><dd>{new Date(receipt.transaction_date).toLocaleString("es-CL", { timeZone: "America/Santiago" })}</dd></div>}
        </>}
      </dl>}
      <div className="webpay-receipt-actions">
        {receipt && !paid && !canRetry && <form action="/api/payments/webpay/status" method="POST"><button type="submit">Consultar estado del pago</button></form>}
        <Link href={canRetry ? "/checkout" : paid ? "/tienda" : "/informacion/contacto"}>{canRetry ? "Volver a intentar" : paid ? "Seguir comprando" : "Contactar a DMaestros"}</Link>
      </div>
      {receipt && <WebpayCartSync attemptId={receipt.id} receiptId={receipt.receipt_id} paidLines={paid ? receipt.paidLines : null} canRetry={canRetry} />}
    </section>
  </main></div>;
}
