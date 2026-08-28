"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, LockKeyhole, MapPin, Store, Truck, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import { checkoutItemsFromCart, shippingTotalForMerchandise } from "@/src/modules/checkout/domain/checkout";
import { formatMoney } from "@/src/shared/money";

type User = { id: string; name: string; email: string };

export function CheckoutForm() {
  const { lines, total, ready } = useCart();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"SHIPPING" | "PICKUP">("SHIPPING");
  const idempotencyKey = useRef(crypto.randomUUID());
  const shipping = shippingTotalForMerchandise(total, deliveryMethod);
  useEffect(() => { fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.json()).then((data: { user: User | null }) => setUser(data.user)).catch(() => setUser(null)); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        idempotencyKey: idempotencyKey.current,
        items: checkoutItemsFromCart(lines),
        customer: { name: String(form.get("name")), email: String(form.get("email")), phone: String(form.get("phone")) },
        shipping: { method: deliveryMethod, recipient: String(form.get("name")), line1: String(form.get("line1") || "") || undefined, line2: String(form.get("line2") || "") || undefined, city: String(form.get("city") || "") || undefined, department: String(form.get("department") || "") || undefined, notes: String(form.get("notes") || "") || undefined },
      };
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { checkoutUrl?: string; message?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error(data.message ?? "No pudimos crear el pedido");
      window.location.assign(data.checkoutUrl);
    } catch (caught) { setError((caught as Error).message); setSubmitting(false); }
  }

  if (!ready || user === undefined) return <div className="page-loader"><span /><p>Preparando checkout seguro…</p></div>;
  if (!lines.length) return <section className="empty-state container"><h1>Tu carrito está vacío</h1><Link className="button button-primary" href="/catalogo">Ir al catálogo</Link></section>;
  if (!user) return <section className="auth-required container"><UserRound size={34} /><p className="eyebrow">Checkout protegido</p><h1>Inicia sesión para guardar tu pedido</h1><p>Usaremos tu cuenta para mostrar aprobaciones, producción y entrega.</p><Link className="button button-gradient" href="/ingresar?next=/checkout">Ingresar o crear cuenta <ChevronRight size={17} /></Link></section>;
  return (
    <form className="container checkout-layout" onSubmit={submit}>
      <div className="checkout-main">
        <div className="checkout-heading"><p className="eyebrow">Finalizar compra</p><h1>¿Cómo recibes tu idea?</h1><p>Sesión de <strong>{user.email}</strong></p></div>
        <fieldset><legend><UserRound size={18} /> Datos de contacto</legend><div className="form-grid"><label>Nombre completo<input required name="name" minLength={2} maxLength={100} defaultValue={user.name} autoComplete="name" /></label><label>Correo<input required name="email" type="email" defaultValue={user.email} autoComplete="email" /></label><label>Teléfono<input required name="phone" inputMode="tel" pattern="[+0-9 -]{7,20}" autoComplete="tel" placeholder="300 123 4567" /></label></div></fieldset>
        <fieldset><legend><MapPin size={18} /> Método de entrega</legend><div className="delivery-options"><button type="button" className={deliveryMethod === "SHIPPING" ? "delivery-option active" : "delivery-option"} onClick={() => setDeliveryMethod("SHIPPING")}><Truck size={21} /><span><strong>Envío nacional</strong><small>Recíbelo en la dirección indicada</small></span></button><button type="button" className={deliveryMethod === "PICKUP" ? "delivery-option active" : "delivery-option"} onClick={() => setDeliveryMethod("PICKUP")}><Store size={21} /><span><strong>Recoger con ArtPrint</strong><small>Coordinamos el punto y horario contigo</small></span></button></div>{deliveryMethod === "SHIPPING" && <div className="form-grid delivery-address"><label className="full-field">Dirección<input required name="line1" minLength={5} maxLength={160} autoComplete="address-line1" placeholder="Calle, carrera, número" /></label><label className="full-field">Complemento<input name="line2" maxLength={160} autoComplete="address-line2" placeholder="Apartamento, oficina (opcional)" /></label><label>Ciudad<input required name="city" minLength={2} maxLength={100} autoComplete="address-level2" /></label><label>Departamento<input required name="department" minLength={2} maxLength={100} autoComplete="address-level1" /></label></div>}<div className="form-grid"><label className="full-field">Notas de producción o entrega<textarea name="notes" maxLength={500} rows={3} placeholder={deliveryMethod === "PICKUP" ? "Horario preferido o indicaciones para contactarte" : "Indicaciones adicionales (opcional)"} /></label></div></fieldset>
        {error && <p className="inline-alert" role="alert">{error}</p>}
      </div>
      <aside className="order-summary checkout-order"><div className="checkout-secure"><LockKeyhole size={18} /><span>Checkout seguro</span></div><h2>Tu pedido</h2><div className="mini-lines">{lines.map((line) => <div key={line.id}><span>{line.quantity}× {line.productName}<small>{line.variant.name}</small></span><strong>{formatMoney(line.quote.total)}</strong></div>)}</div><div className="summary-row"><span>Subtotal</span><span>{formatMoney(total)}</span></div><div className="summary-row"><span>{deliveryMethod === "PICKUP" ? "Recogida" : "Envío"}</span><span>{shipping ? formatMoney(shipping) : "Gratis"}</span></div><div className="summary-grand"><span>Total</span><strong>{formatMoney(total + shipping)}</strong></div><button className="button button-gradient button-block" disabled={submitting}>{submitting ? "Creando pedido…" : "Ir al pago"} <ChevronRight size={17} /></button><p className="legal-note"><CheckCircle2 size={15} /> El pago solo se confirma después del webhook auténtico de la pasarela.</p></aside>
    </form>
  );
}
