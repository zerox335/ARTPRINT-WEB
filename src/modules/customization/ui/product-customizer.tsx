"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Layers3, LockKeyhole, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/src/modules/cart/ui/cart-provider";
import type { ProductView } from "@/src/modules/catalog/domain/catalog";
import type { CustomizationSpec } from "@/src/modules/customization/domain/customization";
import type { PriceQuote, QuoteRequest } from "@/src/modules/pricing/domain/price-engine";
import { formatMoney } from "@/src/shared/money";

const DesignEditor = dynamic(() => import("@/src/modules/customization/ui/design-editor"), { ssr: false, loading: () => <div className="editor-loading">Preparando editor…</div> });

export function ProductCustomizer({ product, initialVariantId, initialQuantity }: { product: ProductView; initialVariantId?: string; initialQuantity?: number }) {
  const router = useRouter();
  const { addLine } = useCart();
  const [variantId, setVariantId] = useState(product.variants.some((item) => item.id === initialVariantId) ? initialVariantId! : product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity ?? 1));
  const [technique, setTechnique] = useState(product.techniques[0] ?? "DTF");
  const [activeAreaId, setActiveAreaId] = useState(product.printAreas[0]?.id ?? "");
  const [size, setSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM");
  const [elements, setElements] = useState<CustomizationSpec["elements"]>([]);
  const [designInstructions, setDesignInstructions] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const variant = product.variants.find((item) => item.id === variantId);
  const activeArea = product.printAreas.find((item) => item.id === activeAreaId) ?? product.printAreas[0];
  const handleElements = useCallback((next: CustomizationSpec["elements"]) => setElements(next), []);
  const areas = useMemo<QuoteRequest["areas"]>(() => product.printAreas.flatMap((area) => { const count = elements.filter((element) => element.printAreaId === area.id).length; return count ? [{ areaKey: area.key, size, elementCount: count, hasPersonalizedText: elements.some((element) => element.printAreaId === area.id && element.type === "TEXT") }] : []; }), [elements, product.printAreas, size]);
  const isPhoneCase = product.categorySlug === "carcasas";

  useEffect(() => {
    if (!variantId) return;
    const controller = new AbortController();
    fetch("/api/pricing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId, quantity, technique, areas }), signal: controller.signal })
      .then(async (response) => { const data = await response.json() as { quote?: PriceQuote; message?: string }; if (!response.ok || !data.quote) throw new Error(data.message ?? "No pudimos cotizar"); return data.quote; })
      .then((next) => { setQuote(next); setQuoteError(""); })
      .catch((error: Error) => { if (error.name !== "AbortError") setQuoteError(error.message); });
    return () => controller.abort();
  }, [variantId, quantity, technique, areas]);

  function addCustomized() {
    if (!quote || !variant || !activeArea) return;
    const customization: CustomizationSpec = { version: 1, productId: product.id, ...(designInstructions.trim() ? { instructions: designInstructions.trim() } : {}), activeView: activeArea.view, elements, preview: { width: 600, height: 675 } };
    addLine({ productId: product.id, productSlug: product.slug, productName: product.name, imageUrl: product.imageUrl, variant: { id: variant.id, name: variant.name, sku: variant.sku }, quantity, technique, areas, customization, quote });
    router.push("/carrito");
  }

  if (!activeArea) return <div className="empty-state"><h1>Este producto aún no tiene áreas configuradas</h1></div>;
  return (
    <div className={`customizer-layout container${isPhoneCase ? " case-customizer-layout" : ""}`}>
      <section className="customizer-workspace">
        <div className="customizer-heading"><div><p className="eyebrow">Estudio ArtPrint</p><h1>{isPhoneCase ? "Diseña sobre el molde real" : "Hazlo inconfundiblemente tuyo"}</h1></div><span>Paso 1 de 2 · Diseña</span></div>
        <div className="view-tabs" role="tablist" aria-label="Vista del producto">{product.printAreas.map((area) => <button role="tab" aria-selected={area.id === activeArea.id} className={area.id === activeArea.id ? "active" : ""} key={area.id} onClick={() => setActiveAreaId(area.id)}>{area.name}</button>)}</div>
        <DesignEditor product={product} area={activeArea} variantColor={variant?.colorHex} onChange={handleElements} />
      </section>
      <aside className="customizer-summary">
        <div className="summary-card"><p className="summary-kicker">Configuración</p><h2>{product.name}</h2><div className="summary-section"><label htmlFor="variant">Variante</label><select id="variant" value={variantId} onChange={(event) => setVariantId(event.target.value)}>{product.variants.filter((item) => item.available).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="summary-section"><label htmlFor="technique">Técnica</label><select id="technique" value={technique} onChange={(event) => setTechnique(event.target.value)}>{product.techniques.map((item) => <option key={item}>{item}</option>)}</select></div><div className="summary-section"><label>Tamaño de impresión</label><div className="size-selector">{(["SMALL", "MEDIUM", "LARGE"] as const).map((item) => <button className={size === item ? "active" : ""} onClick={() => setSize(item)} key={item}>{item === "SMALL" ? "Pequeño" : item === "MEDIUM" ? "Mediano" : "Grande"}</button>)}</div></div><div className="summary-section summary-quantity"><label>Cantidad</label><div className="quantity-control"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><input type="number" value={quantity} min="1" max="1000" aria-label="Cantidad" onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /><button onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div></div><div className="summary-section design-instructions"><label htmlFor="design-instructions">¿Qué quieres que ajustemos?</label><textarea id="design-instructions" value={designInstructions} maxLength={1000} rows={4} onChange={(event) => setDesignInstructions(event.target.value)} placeholder="Ej. Quitar el fondo, poner el nombre Santiago, usar colores dorados y enviarme una prueba antes de producir." /><small>{designInstructions.length}/1000 · El equipo verá esta nota junto con tu diseño.</small></div></div>
        <div className="summary-card price-card"><div className="price-heading"><span>Cotización en tiempo real</span><LockKeyhole size={16} /></div>{quote ? <><div className="price-lines">{quote.lines.filter((line) => line.kind !== "DISCOUNT").map((line) => <div key={line.code}><span>{line.label}</span><span>{formatMoney(line.amount)}</span></div>)}{quote.discountTotal > 0 && <div className="discount-line"><span>Descuento volumen</span><span>−{formatMoney(quote.discountTotal)}</span></div>}</div><div className="price-total"><div><span>Total</span><small>IVA incluido si aplica</small></div><strong>{formatMoney(quote.total)}</strong></div></> : <div className="price-skeleton">Actualizando precio…</div>}{quoteError && <p className="inline-alert">{quoteError}</p>}<button className="button button-gradient button-block" disabled={!quote} onClick={addCustomized}><ShoppingBag size={18} /> Agregar al carrito <ChevronRight size={17} /></button><div className="summary-trust"><span><CheckCircle2 size={15} /> Precio verificado en servidor</span><span><Layers3 size={15} /> {elements.length} {elements.length === 1 ? "elemento" : "elementos"} en tu diseño</span></div></div>
      </aside>
    </div>
  );
}
