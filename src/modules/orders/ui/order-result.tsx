"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock3, FileCheck2, MessageSquareText, PackageSearch, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import { formatMoney } from "@/src/shared/money";

type Proof = { id: string; version: number; previewUrl: string; notes?: string | null; status: string; createdAt: string; decision?: { approved: boolean; comment?: string | null; createdAt: string } | null };
type OrderItem = { id: string; product: { name?: string; imageUrl?: string }; variant: { name?: string }; quantity: number; lineTotal: number; proofs: Proof[] };
type OrderResultData = { number: string; status: string; paymentStatus: string; total: number; createdAt: string; items: OrderItem[]; history: Array<{ id: string; toStatus: string; note?: string | null; createdAt: string }> };
const statusLabel: Record<string, string> = { PENDING_PAYMENT: "Pendiente de pago", PAID: "Pago confirmado", DESIGN_REVIEW: "Revisando tu diseño", WAITING_CUSTOMER_APPROVAL: "Esperando tu aprobación", APPROVED: "Diseño aprobado", IN_PRODUCTION: "En producción", QUALITY_CONTROL: "Control de calidad", READY: "Listo para entregar", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };

export function OrderResult() {
  const number = useSearchParams().get("order");
  const { clear } = useCart();
  const [order, setOrder] = useState<OrderResultData | null>(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState<Record<string, string>>({});
  const [busyProof, setBusyProof] = useState<string>();

  const load = useCallback(async () => {
    if (!number) return null;
    const response = await fetch(`/api/orders/${encodeURIComponent(number)}`, { cache: "no-store" });
    const data = await response.json() as { order?: OrderResultData; message?: string };
    if (!response.ok || !data.order) throw new Error(data.message ?? "Pedido no encontrado");
    setOrder(data.order);
    if (data.order.paymentStatus === "APPROVED") clear();
    return data.order;
  }, [clear, number]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    async function poll() {
      try {
        const next = await load();
        if (!cancelled && next && ["CREATED", "PENDING"].includes(next.paymentStatus) && attempts++ < 5) window.setTimeout(() => void poll(), 1800);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "No pudimos consultar el pedido");
      }
    }
    void poll();
    return () => { cancelled = true; };
  }, [load]);

  async function decide(proof: Proof, approved: boolean) {
    const proofComment = comment[proof.id]?.trim();
    if (!approved && !proofComment) {
      setError("Describe el cambio que necesitas antes de enviarlo.");
      return;
    }
    setBusyProof(proof.id);
    setError("");
    try {
      const response = await fetch(`/api/design-proofs/${encodeURIComponent(proof.id)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved, comment: proofComment || undefined }) });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message ?? "No pudimos guardar tu respuesta");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar tu respuesta");
    } finally {
      setBusyProof(undefined);
    }
  }

  if (error && !order) return <section className="empty-state container"><XCircle size={36} /><h1>No pudimos consultar el pedido</h1><p>{error}</p><Link className="button button-primary" href="/mi-cuenta">Ir a mi cuenta</Link></section>;
  if (!order) return <div className="page-loader"><span /><p>Confirmando el estado con la pasarela…</p></div>;
  if (order.paymentStatus !== "APPROVED") return <section className="result-page container"><div className="result-icon pending"><Clock3 size={42} /></div><p className="eyebrow">Pedido {order.number}</p><h1>Pago en verificación</h1><p>No marcamos el pedido como pagado por una redirección. Esperamos la confirmación auténtica de la pasarela.</p><strong>{formatMoney(order.total)}</strong><div className="result-actions"><Link className="button button-gradient" href="/mi-cuenta"><PackageSearch size={18} /> Consultar más tarde</Link><Link className="button button-secondary" href="/catalogo">Volver al catálogo</Link></div></section>;

  const pendingProofs = order.items.flatMap((item) => item.proofs.filter((proof) => proof.status === "PENDING").map((proof) => ({ item, proof })));
  return <section className="container order-detail-page"><div className="order-detail-hero"><div className="result-icon approved"><CheckCircle2 size={36} /></div><div><p className="eyebrow">Pedido {order.number}</p><h1>{statusLabel[order.status] ?? order.status}</h1><p>Consulta el avance y responde las pruebas de diseño desde esta misma página.</p></div><strong>{formatMoney(order.total)}</strong></div>{error && <p className="inline-alert" role="alert">{error}</p>}{pendingProofs.length > 0 && <section className="customer-proof-section"><div className="section-head"><div><p className="eyebrow">Necesitamos tu respuesta</p><h2 className="section-title">Revisa la prueba final</h2></div><p>La producción comienza únicamente después de tu aprobación.</p></div><div className="customer-proof-grid">{pendingProofs.map(({ item, proof }) => <article className="customer-proof-card" key={proof.id}><div className="proof-image"><Image unoptimized src={proof.previewUrl} alt={`Prueba v${proof.version} de ${item.product.name ?? "producto"}`} width={900} height={900} /></div><div className="proof-copy"><span>Versión {proof.version}</span><h3>{item.product.name ?? "Producto personalizado"}</h3>{proof.notes && <p>{proof.notes}</p>}<label>Cambios que necesitas <small>(solo si no apruebas)</small><textarea rows={3} maxLength={1000} value={comment[proof.id] ?? ""} onChange={(event) => setComment((current) => ({ ...current, [proof.id]: event.target.value }))} placeholder="Ej. Centrar un poco más la fotografía y aumentar el nombre." /></label><div className="proof-actions"><button className="button button-secondary" disabled={busyProof === proof.id} onClick={() => void decide(proof, false)}><MessageSquareText size={17} /> Solicitar cambios</button><button className="button button-gradient" disabled={busyProof === proof.id} onClick={() => void decide(proof, true)}><FileCheck2 size={17} /> Aprobar diseño</button></div></div></article>)}</div></section>}
    <div className="order-detail-grid"><section className="order-items-card"><h2>Productos</h2>{order.items.map((item) => <article key={item.id}><div><strong>{item.quantity}× {item.product.name ?? "Producto personalizado"}</strong><span>{item.variant.name}</span></div><strong>{formatMoney(item.lineTotal)}</strong></article>)}</section><section className="order-timeline"><h2>Seguimiento</h2>{order.history.map((entry) => <div className="timeline-entry" key={entry.id}><span /><div><strong>{statusLabel[entry.toStatus] ?? entry.toStatus}</strong>{entry.note && <p>{entry.note}</p>}<small>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</small></div></div>)}</section></div><div className="result-actions"><Link className="button button-secondary" href="/mi-cuenta"><PackageSearch size={18} /> Ver todos mis pedidos</Link><Link className="button button-gradient" href="/catalogo">Crear otro producto</Link></div></section>;
}
