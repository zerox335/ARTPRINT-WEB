"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FlaskConical, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney } from "@/src/shared/money";

type Payment = { reference: string; amount: number; status: string; orderNumber: string };
export function SandboxCheckout() {
  const search = useSearchParams(); const router = useRouter();
  const reference = search.get("reference");
  const [payment, setPayment] = useState<Payment | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!reference) return; fetch(`/api/payments/sandbox?reference=${encodeURIComponent(reference)}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as { payment?: Payment; message?: string }; if (!response.ok || !data.payment) throw new Error(data.message ?? "Pago no encontrado"); return data.payment; }).then(setPayment).catch((caught: Error) => setError(caught.message)); }, [reference]);
  async function decide(status: "APPROVED" | "DECLINED") { if (!reference) return; setBusy(true); const response = await fetch("/api/payments/sandbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, status }) }); const data = await response.json() as { orderNumber?: string; message?: string }; if (!response.ok || !data.orderNumber) { setError(data.message ?? "No pudimos simular el pago"); setBusy(false); return; } router.push(`/checkout/resultado?order=${encodeURIComponent(data.orderNumber)}`); router.refresh(); }
  if (error) return <section className="empty-state container"><XCircle size={34} /><h1>No pudimos abrir el sandbox</h1><p>{error}</p></section>;
  if (!payment) return <div className="page-loader"><span /><p>Cargando pasarela sandbox…</p></div>;
  return <section className="sandbox-page container"><div className="sandbox-banner"><FlaskConical size={21} /><span>SANDBOX DE DESARROLLO · NO MUEVE DINERO REAL</span></div><div className="sandbox-card"><div className="sandbox-logo">AP</div><p>Pedido {payment.orderNumber}</p><h1>{formatMoney(payment.amount)}</h1><span>COP</span><div className="sandbox-actions"><button className="button sandbox-approve" disabled={busy} onClick={() => void decide("APPROVED")}><CheckCircle2 size={18} /> Simular aprobación</button><button className="button sandbox-decline" disabled={busy} onClick={() => void decide("DECLINED")}><XCircle size={18} /> Simular rechazo</button></div><small>En producción esta pantalla se reemplaza por el checkout alojado de Wompi o Mercado Pago.</small></div></section>;
}
