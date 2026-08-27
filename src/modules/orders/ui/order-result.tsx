"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, PackageSearch, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import { formatMoney } from "@/src/shared/money";

type OrderResult = { number: string; status: string; paymentStatus: string; total: number };
export function OrderResult() {
  const number = useSearchParams().get("order"); const { clear } = useCart();
  const [order, setOrder] = useState<OrderResult | null>(null); const [error, setError] = useState("");
  useEffect(() => { if (!number) return; let attempts = 0; const load = () => fetch(`/api/orders/${encodeURIComponent(number)}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as { order?: OrderResult; message?: string }; if (!response.ok || !data.order) throw new Error(data.message ?? "Pedido no encontrado"); setOrder(data.order); if (data.order.paymentStatus === "APPROVED") clear(); if (["CREATED", "PENDING"].includes(data.order.paymentStatus) && attempts++ < 5) window.setTimeout(load, 1800); }).catch((caught: Error) => setError(caught.message)); void load(); }, [number, clear]);
  if (error) return <section className="empty-state container"><XCircle size={36} /><h1>No pudimos consultar el pedido</h1><p>{error}</p><Link className="button button-primary" href="/mi-cuenta">Ir a mi cuenta</Link></section>;
  if (!order) return <div className="page-loader"><span /><p>Confirmando el estado con la pasarela…</p></div>;
  const approved = order.paymentStatus === "APPROVED";
  return <section className="result-page container"><div className={approved ? "result-icon approved" : "result-icon pending"}>{approved ? <CheckCircle2 size={42} /> : <Clock3 size={42} />}</div><p className="eyebrow">Pedido {order.number}</p><h1>{approved ? "Pago confirmado" : "Pago en verificación"}</h1><p>{approved ? "Recibimos tu pedido. Nuestro equipo revisará el diseño y te avisará cuando la prueba esté lista." : "No marcamos un pedido como pagado por una redirección. Esperamos la confirmación auténtica de la pasarela."}</p><strong>{formatMoney(order.total)}</strong><div className="result-actions"><Link className="button button-gradient" href="/mi-cuenta"><PackageSearch size={18} /> Seguir mi pedido</Link><Link className="button button-secondary" href="/catalogo">Volver al catálogo</Link></div></section>;
}
