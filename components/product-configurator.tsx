"use client";

import Link from "next/link";
import { Check, Minus, Plus, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import type { ProductView } from "@/src/modules/catalog/domain/catalog";
import type { PriceQuote } from "@/src/modules/pricing/domain/price-engine";
import { formatMoney } from "@/src/shared/money";

export function ProductConfigurator({ product }: { product: ProductView }) {
  const firstVariant = product.variants.find((variant) => variant.available);
  const [variantId, setVariantId] = useState(firstVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addLine } = useCart();
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId), [product.variants, variantId]);
  const technique = product.techniques[0] ?? "DTF";

  useEffect(() => {
    if (!variantId) return;
    const controller = new AbortController();
    fetch("/api/pricing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId, quantity, technique, areas: [] }), signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("No pudimos actualizar el precio"); return response.json() as Promise<{ quote: PriceQuote }>; })
      .then((data) => { setQuote(data.quote); setError(""); })
      .catch((caught: unknown) => { if ((caught as Error).name !== "AbortError") setError((caught as Error).message); });
    return () => controller.abort();
  }, [variantId, quantity, technique]);

  function addBasicProduct() {
    if (!quote || !variant) return;
    addLine({ productId: product.id, productSlug: product.slug, productName: product.name, imageUrl: product.imageUrl, variant: { id: variant.id, name: variant.name, sku: variant.sku }, quantity, technique, areas: [], quote });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      <div className="option-group"><div className="option-label"><span>Elige una variante</span><span>{variant?.sku}</span></div><div className="option-cards">{product.variants.map((item) => <button key={item.id} className={item.id === variantId ? "option-card selected" : "option-card"} onClick={() => setVariantId(item.id)} disabled={!item.available}>{item.name}</button>)}</div></div>
      <div className="option-group"><div className="option-label"><span>Cantidad</span><span>{quantity >= 12 ? "Descuento por volumen aplicado" : "Descuento desde 12 unidades"}</span></div><div className="quantity-control"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Restar unidad"><Minus size={15} /></button><input aria-label="Cantidad" type="number" min="1" max="1000" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(1000, Number(event.target.value))))} /><button onClick={() => setQuantity((value) => Math.min(1000, value + 1))} aria-label="Sumar unidad"><Plus size={15} /></button></div></div>
      {quote && <div className="quote-inline"><span>{quantity} {quantity === 1 ? "unidad" : "unidades"}{quote.discountPercent ? ` · ${quote.discountPercent}% de descuento` : ""}</span><strong>{formatMoney(quote.total)}</strong></div>}
      {error && <p className="inline-alert" role="alert">{error}</p>}
      <div className="product-actions"><button className="button button-secondary" onClick={addBasicProduct} disabled={!quote}>{added ? <><Check size={18} /> Agregado</> : product.readyMade ? "Agregar diseño listo" : "Agregar sin diseño"}</button>{product.customizable && <Link className="button button-gradient" href={`/personalizar/${product.slug}?variant=${variantId}&quantity=${quantity}`}><Sparkles size={18} /> {product.readyMade ? "Añadir personalización" : "Personalizar ahora"}</Link>}</div>
      <div className="feature-list"><div><ShieldCheck size={18} /><span>Pago confirmado solo por webhook seguro</span></div><div><Check size={18} /><span>Prueba de diseño antes de producción</span></div><div><Truck size={18} /><span>{product.leadTime} tras aprobación</span></div></div>
    </div>
  );
}
