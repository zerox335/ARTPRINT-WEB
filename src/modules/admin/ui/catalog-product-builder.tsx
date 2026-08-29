"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminImageUploader, type AdminUploadedAsset } from "@/src/modules/admin/ui/admin-image-uploader";
import { VisualAreaCalibrator } from "@/src/modules/admin/ui/visual-area-calibrator";

type MockupView = "FRONT" | "BACK" | "LEFT_SLEEVE" | "RIGHT_SLEEVE" | "WRAP" | "CUSTOM";
type AreaDraft = { name: string; x: number; y: number; width: number; height: number; realWidthCm: number; realHeightCm: number; allowOverflow: boolean; shape: "RECTANGLE" | "ROUNDED" | "CIRCLE"; exclusionEnabled: boolean; exclusionName: string; exclusionX: number; exclusionY: number; exclusionWidth: number; exclusionHeight: number; exclusionRadius: number };
type MockupDraft = { id: string; name: string; view: MockupView; asset?: AdminUploadedAsset; area: AreaDraft };

const viewLabels: Record<MockupView, string> = { FRONT: "Frente", BACK: "Posterior", LEFT_SLEEVE: "Manga izquierda", RIGHT_SLEEVE: "Manga derecha", WRAP: "Envolvente", CUSTOM: "Vista especial" };

function makeMockup(index: number): MockupDraft {
  return { id: crypto.randomUUID(), name: index ? `Vista ${index + 1}` : "Frente", view: index ? "BACK" : "FRONT", area: { name: "Área principal", x: 30, y: 20, width: 40, height: 55, realWidthCm: 20, realHeightCm: 28, allowOverflow: false, shape: "RECTANGLE", exclusionEnabled: false, exclusionName: "Zona protegida", exclusionX: 30, exclusionY: 5, exclusionWidth: 20, exclusionHeight: 20, exclusionRadius: 8 } };
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function list(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function number(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function AreaNumber({ label, value, suffix = "%", min = 0, max = 100, onChange }: { label: string; value: number; suffix?: string; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label>{label}<span><input type="number" value={value} min={min} max={max} step="0.1" onChange={(event) => onChange(Number(event.target.value))} /><small>{suffix}</small></span></label>;
}

export function CatalogProductBuilder({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [productType, setProductType] = useState("TEXTILE");
  const [customizable, setCustomizable] = useState(true);
  const [gallery, setGallery] = useState<AdminUploadedAsset[]>([]);
  const [mockups, setMockups] = useState<MockupDraft[]>([makeMockup(0)]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  function updateMockup(id: string, update: (mockup: MockupDraft) => MockupDraft) {
    setMockups((current) => current.map((mockup) => mockup.id === id ? update(mockup) : mockup));
  }

  function addToGallery(asset: AdminUploadedAsset) {
    setGallery((current) => current.some((item) => item.id === asset.id) ? current : [...current, asset]);
  }

  function reset() {
    setName(""); setSlug(""); setSlugEdited(false); setProductType("TEXTILE"); setCustomizable(true); setGallery([]); setMockups([makeMockup(0)]); setMessage(""); setCreatedSlug("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setCreatedSlug("");
    try {
      if (!gallery.length) throw new Error("Sube al menos una imagen o mockup del producto");
      if (customizable && mockups.some((mockup) => !mockup.asset)) throw new Error("Cada vista personalizable necesita su imagen de mockup");
      const form = new FormData(event.currentTarget);
      const payload = {
        name,
        slug,
        categoryId: String(form.get("categoryId")),
        productType,
        shortDescription: String(form.get("shortDescription")),
        description: String(form.get("description")),
        basePrice: number(form.get("basePrice")),
        costPrice: optional(form.get("costPrice")) ? number(form.get("costPrice")) : undefined,
        status: String(form.get("status")),
        featured: form.get("featured") === "on",
        customizable,
        brand: optional(form.get("brand")),
        series: optional(form.get("series")),
        deviceModel: optional(form.get("deviceModel")),
        badge: optional(form.get("badge")),
        leadTime: String(form.get("leadTime")),
        techniques: list(form.get("techniques")),
        highlights: list(form.get("highlights")),
        readyMade: form.get("readyMade") === "on",
        designTheme: optional(form.get("designTheme")),
        designTags: list(form.get("designTags")),
        variant: {
          sku: String(form.get("sku")),
          name: String(form.get("variantName")),
          color: optional(form.get("color")),
          colorHex: optional(form.get("colorHex")),
          size: optional(form.get("size")),
          material: optional(form.get("material")),
          technique: optional(form.get("variantTechnique")),
          priceModifier: number(form.get("priceModifier")),
          trackInventory: form.get("trackInventory") === "on",
          quantity: number(form.get("quantity")),
        },
        galleryAssetIds: gallery.map((asset) => asset.id),
        mockups: customizable ? mockups.map((mockup) => ({
          assetId: mockup.asset!.id,
          name: mockup.name,
          view: mockup.view,
          widthPx: mockup.asset!.width,
          heightPx: mockup.asset!.height,
          printAreas: [{
            name: mockup.area.name,
            x: mockup.area.x,
            y: mockup.area.y,
            width: mockup.area.width,
            height: mockup.area.height,
            realWidthCm: mockup.area.realWidthCm,
            realHeightCm: mockup.area.realHeightCm,
            allowOverflow: mockup.area.allowOverflow,
            shape: mockup.area.shape,
            exclusions: mockup.area.exclusionEnabled ? [{ name: mockup.area.exclusionName, x: mockup.area.exclusionX, y: mockup.area.exclusionY, width: mockup.area.exclusionWidth, height: mockup.area.exclusionHeight, radius: mockup.area.exclusionRadius }] : [],
          }],
        })) : [],
      };
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { product?: { slug: string }; message?: string; issues?: Array<{ path: string; message: string }> };
      if (!response.ok || !body.product) throw new Error(body.issues?.[0] ? `${body.issues[0].path}: ${body.issues[0].message}` : body.message ?? "No pudimos crear el producto");
      setMessage(`${body.message}. Ya aparece en el catálogo si elegiste estado activo.`);
      setCreatedSlug(body.product.slug);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos crear el producto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="catalog-builder" onSubmit={submit}>
      <section className="builder-section">
        <div className="builder-section-title"><span>01</span><div><h2>Información comercial</h2><p>Lo que verá el cliente en el catálogo y en la ficha.</p></div></div>
        <div className="form-grid">
          <label>Nombre del producto<input required minLength={3} value={name} onChange={(event) => { const nextName = event.target.value; setName(nextName); if (!slugEdited) setSlug(slugify(nextName)); }} placeholder="Carcasa Samsung Galaxy A55" /></label>
          <label>URL / slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="carcasa-samsung-galaxy-a55" /></label>
          <label>Tipo de producto<select value={productType} onChange={(event) => setProductType(event.target.value)}><option value="TEXTILE">Camiseta o textil</option><option value="CASE">Carcasa de celular</option><option value="DRINKWARE">Mug, vaso o termo</option><option value="ACCESSORY">Accesorio</option><option value="OTHER">Otro producto</option></select></label>
          <label>Categoría<select name="categoryId" required>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label>Precio de venta (COP)<input name="basePrice" required type="number" min="1000" step="1" /></label>
          <label>Costo interno (COP)<input name="costPrice" type="number" min="0" step="1" /></label>
          <label>Estado<select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Publicado</option><option value="DRAFT">Borrador privado</option></select></label>
          <label>Tiempo de entrega<input name="leadTime" required defaultValue="3–6 días hábiles" /></label>
          <label className="full-field">Descripción corta<input name="shortDescription" required minLength={10} maxLength={220} placeholder="Resumen comercial para tarjetas y buscadores" /></label>
          <label className="full-field">Descripción completa<textarea name="description" required minLength={20} rows={4} placeholder="Materiales, acabados, usos y recomendaciones…" /></label>
          <label>Técnicas disponibles<input name="techniques" required defaultValue="Sublimación" placeholder="DTF, Sublimación, UV" /></label>
          <label>Insignia opcional<input name="badge" placeholder="Nuevo, Más vendido…" /></label>
          <label className="full-field">Características destacadas<textarea name="highlights" rows={2} placeholder="Una característica por línea o separadas por coma" /></label>
          <label>Tema del diseño listo<input name="designTheme" placeholder="Anime, cumpleaños, parejas…" /></label>
          <label>Etiquetas del diseño<input name="designTags" placeholder="anime, dragón, juvenil" /></label>
          <label className="check-field"><input name="featured" type="checkbox" /> Destacar en la tienda</label>
          <label className="check-field"><input name="readyMade" type="checkbox" /> Mostrar en Diseños listos</label>
          <label className="check-field"><input type="checkbox" checked={customizable} onChange={(event) => setCustomizable(event.target.checked)} /> Permitir personalización</label>
        </div>
      </section>

      <section className="builder-section">
        <div className="builder-section-title"><span>02</span><div><h2>Referencia y variante inicial</h2><p>Sirve para camisas, tallas, colores, capacidades o modelos de celular.</p></div></div>
        <div className="form-grid">
          <label>Marca<input name="brand" required={productType === "CASE"} placeholder="Samsung, Apple, ArtPrint…" /></label>
          <label>Serie<input name="series" placeholder="Galaxy A, iPhone 15, Camiseta Premium…" /></label>
          <label>Modelo o referencia<input name="deviceModel" required={productType === "CASE"} placeholder="Galaxy A55, 11 oz, Unisex…" /></label>
          <label>SKU<input name="sku" required pattern="[A-Za-z0-9_-]+" placeholder="AP-CASE-SA55" /></label>
          <label>Nombre de la variante<input name="variantName" required defaultValue="Estándar" /></label>
          <label>Material<input name="material" placeholder="TPU, algodón, cerámica…" /></label>
          <label>Color<input name="color" placeholder="Blanco" /></label>
          <label>Color visual<input name="colorHex" type="color" defaultValue="#ffffff" /></label>
          <label>Talla / capacidad<input name="size" placeholder="M, 600 ml, Galaxy A55…" /></label>
          <label>Técnica principal<input name="variantTechnique" defaultValue="Sublimación" /></label>
          <label>Ajuste de precio<input name="priceModifier" type="number" defaultValue="0" step="1" /></label>
          <label>Unidades disponibles<input name="quantity" type="number" defaultValue="0" min="0" step="1" /></label>
          <label className="check-field full-field"><input name="trackInventory" type="checkbox" /> Controlar inventario para esta variante</label>
        </div>
      </section>

      <section className="builder-section">
        <div className="builder-section-title"><span>03</span><div><h2>Fotografías y galería</h2><p>La primera imagen será la portada. Los mockups cargados también se agregan automáticamente.</p></div></div>
        <AdminImageUploader label="Agregar fotografía" hint="PNG o JPG, máximo 12 MB y 12000 × 12000 px." onUploaded={addToGallery} />
        {gallery.length > 0 && <div className="admin-gallery-list">{gallery.map((asset, index) => <div key={asset.id}><Image src={asset.url} alt={asset.name} width={asset.width} height={asset.height} /><span>{index === 0 ? "Portada" : `Galería ${index + 1}`}</span><button type="button" onClick={() => setGallery((current) => current.filter((item) => item.id !== asset.id))} aria-label={`Quitar ${asset.name}`}><Trash2 size={15} /></button></div>)}</div>}
      </section>

      {customizable && <section className="builder-section">
        <div className="builder-section-title"><span>04</span><div><h2>Constructor de mockups</h2><p>Agrega frente, espalda, mangas o envolvente. Ajusta el rectángulo morado sobre la zona que realmente se puede imprimir.</p></div></div>
        <div className="admin-mockup-list">
          {mockups.map((mockup, index) => <article className="admin-mockup-editor" key={mockup.id}>
            <div className="admin-mockup-head"><div><span>Vista {index + 1}</span><h3>{mockup.name}</h3></div>{mockups.length > 1 && <button type="button" onClick={() => setMockups((current) => current.filter((item) => item.id !== mockup.id))}><Trash2 size={16} /> Quitar vista</button>}</div>
            <div className="admin-mockup-grid">
              <div>
                <AdminImageUploader label="Imagen base del mockup" hint="Usa el producto vacío, visto de frente a la cámara." value={mockup.asset} onUploaded={(asset) => { updateMockup(mockup.id, (current) => ({ ...current, asset })); addToGallery(asset); }} onRemove={() => updateMockup(mockup.id, (current) => ({ ...current, asset: undefined }))} />
                {mockup.asset && <VisualAreaCalibrator src={mockup.asset.url} alt={`Previsualización de ${mockup.name}`} width={mockup.asset.width} height={mockup.asset.height} area={mockup.area} shape={mockup.area.shape} onAreaChange={(next) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, ...next } }))} exclusion={mockup.area.exclusionEnabled ? { x: mockup.area.exclusionX, y: mockup.area.exclusionY, width: mockup.area.exclusionWidth, height: mockup.area.exclusionHeight } : undefined} exclusionRadius={mockup.area.exclusionRadius} onExclusionChange={(next) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionX: next.x, exclusionY: next.y, exclusionWidth: next.width, exclusionHeight: next.height } }))} />}
              </div>
              <div className="admin-area-controls">
                <div className="form-grid"><label>Nombre de vista<input value={mockup.name} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, name: event.target.value }))} /></label><label>Orientación<select value={mockup.view} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, view: event.target.value as MockupView, name: current.name || viewLabels[event.target.value as MockupView] }))}>{Object.entries(viewLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Forma del área<select value={mockup.area.shape} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, shape: event.target.value as AreaDraft["shape"] } }))}><option value="RECTANGLE">Rectangular</option><option value="ROUNDED">Redondeada</option><option value="CIRCLE">Circular</option></select></label><label className="full-field">Nombre del área<input value={mockup.area.name} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, name: event.target.value } }))} /></label></div>
                <p className="admin-control-label">Zona imprimible en porcentaje</p>
                <div className="admin-coordinate-grid"><AreaNumber label="X" value={mockup.area.x} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, x: value } }))} /><AreaNumber label="Y" value={mockup.area.y} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, y: value } }))} /><AreaNumber label="Ancho" value={mockup.area.width} min={0.1} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, width: value } }))} /><AreaNumber label="Alto" value={mockup.area.height} min={0.1} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, height: value } }))} /><AreaNumber label="Ancho real" value={mockup.area.realWidthCm} suffix="cm" min={0.1} max={300} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, realWidthCm: value } }))} /><AreaNumber label="Alto real" value={mockup.area.realHeightCm} suffix="cm" min={0.1} max={300} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, realHeightCm: value } }))} /></div>
                <label className="check-field"><input type="checkbox" checked={mockup.area.allowOverflow} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, allowOverflow: event.target.checked } }))} /> Permitir que el cliente extienda el diseño fuera del borde</label>
                <label className="check-field"><input type="checkbox" checked={mockup.area.exclusionEnabled} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionEnabled: event.target.checked } }))} /> Proteger cámara, asa u otra zona</label>
                {mockup.area.exclusionEnabled && <><label className="admin-exclusion-name">Nombre de la zona protegida<input value={mockup.area.exclusionName} onChange={(event) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionName: event.target.value } }))} /></label><div className="admin-coordinate-grid"><AreaNumber label="X" value={mockup.area.exclusionX} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionX: value } }))} /><AreaNumber label="Y" value={mockup.area.exclusionY} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionY: value } }))} /><AreaNumber label="Ancho" value={mockup.area.exclusionWidth} min={0.1} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionWidth: value } }))} /><AreaNumber label="Alto" value={mockup.area.exclusionHeight} min={0.1} onChange={(value) => updateMockup(mockup.id, (current) => ({ ...current, area: { ...current.area, exclusionHeight: value } }))} /></div></>}
              </div>
            </div>
          </article>)}
        </div>
        <button className="button button-secondary" type="button" onClick={() => setMockups((current) => [...current, makeMockup(current.length)])}><Plus size={17} /> Agregar otra vista</button>
      </section>}

      <div className="builder-submit"><div>{message && <p className={createdSlug ? "admin-success" : "inline-alert"} aria-live="polite">{message}</p>}{createdSlug && <Link href={`/productos/${createdSlug}`} target="_blank"><Eye size={16} /> Ver producto publicado</Link>}</div><div>{createdSlug && <button className="button button-secondary" type="button" onClick={reset}>Crear otro</button>}<button className="button button-gradient" disabled={busy}><Save size={17} /> {busy ? "Guardando catálogo…" : "Guardar producto completo"}</button></div></div>
      <p className="builder-security"><Sparkles size={16} /> Las imágenes se validan por contenido, dimensiones y tamaño. El precio y la publicación se verifican nuevamente en el servidor.</p>
    </form>
  );
}
