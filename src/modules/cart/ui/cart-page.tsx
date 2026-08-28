"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, PackageCheck, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import { FREE_SHIPPING_MINIMUM, shippingTotalForMerchandise } from "@/src/modules/checkout/domain/checkout";
import { formatMoney } from "@/src/shared/money";

export function CartPage() {
  const { lines, ready, total, removeLine } = useCart();
  const shipping = shippingTotalForMerchandise(total);
  if (!ready) return <div className="page-loader"><span /><p>Cargando carrito…</p></div>;
  if (!lines.length) return <section className="empty-state container"><span>TU CARRITO</span><h1>Hay espacio para una gran idea</h1><p>Elige un producto y conviértelo en algo solo tuyo.</p><Link className="button button-gradient" href="/catalogo">Explorar productos <ChevronRight size={17} /></Link></section>;
  return (
    <section className="container cart-layout">
      <div className="cart-main"><div className="cart-heading"><div><p className="eyebrow">Tu selección</p><h1>Carrito</h1></div><span>{lines.length} {lines.length === 1 ? "diseño" : "diseños"}</span></div><div className="cart-lines">{lines.map((line) => <article className="cart-line" key={line.id}>{line.customization?.preview.dataUrl ? <Image unoptimized className="cart-design-preview" src={line.customization.preview.dataUrl} width={160} height={180} alt={`Vista previa de ${line.productName}`} /> : <Image src={line.imageUrl} width={160} height={180} alt={line.productName} />}<div className="cart-line-info"><div><span>{line.variant.sku}</span><h2>{line.productName}</h2><p>{line.variant.name}</p>{line.customization?.instructions && <p className="cart-design-note"><strong>Solicitud de diseño:</strong> {line.customization.instructions}</p>}</div><div className="line-tags"><span>{line.quantity} ud.</span><span>{line.technique}</span>{line.customization && <span>{line.customization.elements.length} capas</span>}</div>{line.customization && <Link href={`/personalizar/${line.productSlug}?variant=${line.variant.id}&quantity=${line.quantity}&edit=${encodeURIComponent(line.id)}`}>Editar este diseño</Link>}</div><div className="cart-line-price"><strong>{formatMoney(line.quote.total)}</strong><small>{formatMoney(line.quote.unitPrice)} c/u</small><button onClick={() => removeLine(line.id)} aria-label={`Eliminar ${line.productName}`}><Trash2 size={17} /></button></div></article>)}</div><Link className="back-link" href="/catalogo"><ArrowLeft size={16} /> Seguir comprando</Link></div>
      <aside className="order-summary"><h2>Resumen</h2><div className="summary-row"><span>Productos</span><span>{formatMoney(total)}</span></div><div className="summary-row"><span>Envío</span><span>{shipping ? formatMoney(shipping) : "Gratis"}</span></div>{shipping > 0 && <p className="shipping-notice">Agrega {formatMoney(FREE_SHIPPING_MINIMUM - total)} para envío gratis.</p>}<div className="summary-grand"><span>Total</span><strong>{formatMoney(total + shipping)}</strong></div><Link className="button button-gradient button-block" href="/checkout">Continuar al checkout <ChevronRight size={17} /></Link><div className="checkout-trust"><span><ShieldCheck size={17} /> El navegador no decide el precio final</span><span><PackageCheck size={17} /> Producción después de aprobación</span></div></aside>
    </section>
  );
}
