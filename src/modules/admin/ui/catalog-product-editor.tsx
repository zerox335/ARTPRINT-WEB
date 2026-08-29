"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ImagePlus, Plus, Save, Shapes, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminImageUploader, type AdminUploadedAsset } from "@/src/modules/admin/ui/admin-image-uploader";
import { VisualAreaCalibrator } from "@/src/modules/admin/ui/visual-area-calibrator";

type MockupView = "FRONT" | "BACK" | "LEFT_SLEEVE" | "RIGHT_SLEEVE" | "WRAP" | "CUSTOM";
type AreaShape = "RECTANGLE" | "ROUNDED" | "CIRCLE";
type GalleryDraft = { key: string; url: string; assetId?: string; name: string; width: number; height: number };
type ExclusionDraft = { key: string; id?: string; name: string; x: number; y: number; width: number; height: number; radius: number };
type AreaDraft = { key: string; id?: string; name: string; x: number; y: number; width: number; height: number; realWidthCm: number; realHeightCm: number; allowOverflow: boolean; shape: AreaShape; exclusions: ExclusionDraft[] };
type MockupDraft = { key: string; id?: string; name: string; view: MockupView; imageUrl: string; assetId?: string; widthPx: number; heightPx: number; areas: AreaDraft[]; selectedAreaKey: string };
type VariantDraft = { key: string; id?: string; sku: string; name: string; color?: string; colorHex?: string; size?: string; material?: string; technique?: string; priceModifier: number; active: boolean; trackInventory: boolean; quantity: number };

export type AdminProductEditorData = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  productType: "TEXTILE" | "CASE" | "DRINKWARE" | "ACCESSORY" | "OTHER";
  shortDescription: string;
  description: string;
  basePrice: number;
  costPrice?: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  customizable: boolean;
  brand?: string;
  series?: string;
  deviceModel?: string;
  badge?: string;
  leadTime: string;
  techniques: string[];
  highlights: string[];
  readyMade: boolean;
  designTheme?: string;
  designTags: string[];
  gallery: GalleryDraft[];
  variants: VariantDraft[];
  mockups: MockupDraft[];
};

const viewLabels: Record<MockupView, string> = { FRONT: "Frente", BACK: "Espalda", LEFT_SLEEVE: "Manga izquierda", RIGHT_SLEEVE: "Manga derecha", WRAP: "Envolvente", CUSTOM: "Vista especial" };
const shapeLabels: Record<AreaShape, string> = { RECTANGLE: "Rectangular", ROUNDED: "Redondeada", CIRCLE: "Circular" };

function optional(value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); return text || undefined; }
function list(value: FormDataEntryValue | null) { return String(value ?? "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean); }
function numeric(value: FormDataEntryValue | null, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function key() { return crypto.randomUUID(); }
function newArea(index: number): AreaDraft { const areaKey = key(); return { key: areaKey, name: index ? `Área ${index + 1}` : "Área principal", x: 30, y: 20, width: 40, height: 55, realWidthCm: 20, realHeightCm: 28, allowOverflow: false, shape: "RECTANGLE", exclusions: [] }; }
function newMockup(index: number): MockupDraft { const area = newArea(0); return { key: key(), name: index ? `Vista ${index + 1}` : "Frente", view: index ? "BACK" : "FRONT", imageUrl: "", widthPx: 1024, heightPx: 1024, areas: [area], selectedAreaKey: area.key }; }
function newVariant(index: number): VariantDraft { return { key: key(), sku: `AP-NUEVO-${index + 1}`, name: `Variante ${index + 1}`, colorHex: "#ffffff", priceModifier: 0, active: true, trackInventory: false, quantity: 0 }; }

function NumberField({ label, value, suffix = "%", min = 0, max = 100, onChange }: { label: string; value: number; suffix?: string; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label>{label}<span><input type="number" value={value} min={min} max={max} step="0.1" onChange={(event) => onChange(Number(event.target.value))} /><small>{suffix}</small></span></label>;
}

export function CatalogProductEditor({ initial, categories }: { initial: AdminProductEditorData; categories: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initial.gallery);
  const [variants, setVariants] = useState(initial.variants);
  const [mockups, setMockups] = useState(initial.mockups);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  function updateVariant(variantKey: string, updates: Partial<VariantDraft>) { setVariants((current) => current.map((variant) => variant.key === variantKey ? { ...variant, ...updates } : variant)); }
  function updateMockup(mockupKey: string, update: (mockup: MockupDraft) => MockupDraft) { setMockups((current) => current.map((mockup) => mockup.key === mockupKey ? update(mockup) : mockup)); }
  function updateArea(mockupKey: string, areaKey: string, update: (area: AreaDraft) => AreaDraft) { updateMockup(mockupKey, (mockup) => ({ ...mockup, areas: mockup.areas.map((area) => area.key === areaKey ? update(area) : area) })); }
  function addGallery(asset: AdminUploadedAsset) { setGallery((current) => [...current, { key: key(), assetId: asset.id, url: asset.url, name: asset.name, width: asset.width, height: asset.height }]); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setSaved(false);
    try {
      if (!gallery.length) throw new Error("El producto necesita al menos una fotografía");
      if (!variants.length) throw new Error("El producto necesita al menos una variante");
      if (mockups.some((mockup) => !mockup.imageUrl && !mockup.assetId)) throw new Error("Cada vista necesita una imagen base");
      const form = new FormData(event.currentTarget);
      const payload = {
        name: String(form.get("name")), slug: String(form.get("slug")), categoryId: String(form.get("categoryId")), productType: String(form.get("productType")),
        shortDescription: String(form.get("shortDescription")), description: String(form.get("description")), basePrice: numeric(form.get("basePrice")), costPrice: optional(form.get("costPrice")) ? numeric(form.get("costPrice")) : undefined,
        status: String(form.get("status")), featured: form.get("featured") === "on", customizable: form.get("customizable") === "on",
        brand: optional(form.get("brand")), series: optional(form.get("series")), deviceModel: optional(form.get("deviceModel")), badge: optional(form.get("badge")), leadTime: String(form.get("leadTime")), techniques: list(form.get("techniques")), highlights: list(form.get("highlights")),
        readyMade: form.get("readyMade") === "on", designTheme: optional(form.get("designTheme")), designTags: list(form.get("designTags")),
        gallery: gallery.map((image) => image.assetId ? { assetId: image.assetId } : { url: image.url }),
        variants: variants.map((variant) => { const { key: draftKey, ...payload } = variant; void draftKey; return payload; }),
        mockups: mockups.map((mockup) => ({ id: mockup.id, name: mockup.name, view: mockup.view, ...(mockup.assetId ? { assetId: mockup.assetId } : { url: mockup.imageUrl }), widthPx: mockup.widthPx, heightPx: mockup.heightPx, printAreas: mockup.areas.map((area) => { const { key: areaKey, exclusions, ...areaPayload } = area; void areaKey; return { ...areaPayload, exclusions: exclusions.map((exclusion) => { const { key: exclusionKey, ...exclusionPayload } = exclusion; void exclusionKey; return exclusionPayload; }) }; }) })),
      };
      const response = await fetch(`/api/admin/products/${encodeURIComponent(initial.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { product?: { slug: string }; message?: string; issues?: Array<{ path: string; message: string }> };
      if (!response.ok || !body.product) throw new Error(body.issues?.[0] ? `${body.issues[0].path}: ${body.issues[0].message}` : body.message ?? "No pudimos guardar los cambios");
      setMessage(body.message ?? "Producto actualizado"); setSaved(true); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos guardar los cambios"); }
    finally { setBusy(false); }
  }

  return <form className="catalog-builder" onSubmit={submit}>
    <section className="builder-section"><div className="builder-section-title"><span>01</span><div><h2>Producto y publicación</h2><p>Edita la información comercial y decide dónde se muestra.</p></div></div><div className="form-grid">
      <label>Nombre<input name="name" required minLength={3} defaultValue={initial.name} /></label><label>URL / slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={initial.slug} /></label>
      <label>Tipo<select name="productType" defaultValue={initial.productType}><option value="TEXTILE">Camiseta o textil</option><option value="CASE">Carcasa</option><option value="DRINKWARE">Mug, vaso o termo</option><option value="ACCESSORY">Accesorio</option><option value="OTHER">Otro</option></select></label><label>Categoría<select name="categoryId" defaultValue={initial.categoryId}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label>Precio de venta<input name="basePrice" type="number" min="1000" defaultValue={initial.basePrice} /></label><label>Costo interno<input name="costPrice" type="number" min="0" defaultValue={initial.costPrice} /></label><label>Estado<select name="status" defaultValue={initial.status}><option value="ACTIVE">Publicado</option><option value="DRAFT">Borrador</option><option value="ARCHIVED">Archivado</option></select></label><label>Tiempo de entrega<input name="leadTime" defaultValue={initial.leadTime} /></label>
      <label className="full-field">Descripción corta<input name="shortDescription" required minLength={10} maxLength={220} defaultValue={initial.shortDescription} /></label><label className="full-field">Descripción completa<textarea name="description" required minLength={20} rows={4} defaultValue={initial.description} /></label>
      <label>Marca<input name="brand" defaultValue={initial.brand} /></label><label>Serie<input name="series" defaultValue={initial.series} /></label><label>Modelo o referencia<input name="deviceModel" defaultValue={initial.deviceModel} /></label><label>Insignia<input name="badge" defaultValue={initial.badge} /></label><label>Técnicas<input name="techniques" defaultValue={initial.techniques.join(", ")} /></label><label>Características<input name="highlights" defaultValue={initial.highlights.join(", ")} /></label>
      <label className="check-field"><input name="featured" type="checkbox" defaultChecked={initial.featured} /> Destacar en la tienda</label><label className="check-field"><input name="customizable" type="checkbox" defaultChecked={initial.customizable} /> Permitir personalización</label>
    </div></section>

    <section className="builder-section ready-made-admin"><div className="builder-section-title"><span>02</span><div><h2>Diseño listo para elegir</h2><p>Marca productos terminados, como diseños anime, cumpleaños o parejas.</p></div></div><div className="form-grid"><label className="check-field full-field"><input name="readyMade" type="checkbox" defaultChecked={initial.readyMade} /> Mostrar este producto en la pestaña Diseños listos</label><label>Tema<input name="designTheme" defaultValue={initial.designTheme} placeholder="Anime" /></label><label>Etiquetas<input name="designTags" defaultValue={initial.designTags.join(", ")} placeholder="dragón, juvenil, colores vivos" /></label></div></section>

    <section className="builder-section"><div className="builder-section-title"><span>03</span><div><h2>Variantes e inventario</h2><p>Edita tallas, colores, capacidades, materiales, precios y existencias.</p></div></div><div className="admin-variant-list">{variants.map((variant, index) => <article key={variant.key} className="admin-variant-editor"><div className="admin-mockup-head"><div><span>Variante {index + 1}</span><h3>{variant.name}</h3></div>{variants.length > 1 && <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.key !== variant.key))}><Trash2 size={16} /> Quitar</button>}</div><div className="form-grid"><label>SKU<input value={variant.sku} onChange={(event) => updateVariant(variant.key, { sku: event.target.value.toUpperCase() })} /></label><label>Nombre<input value={variant.name} onChange={(event) => updateVariant(variant.key, { name: event.target.value })} /></label><label>Color<input value={variant.color ?? ""} onChange={(event) => updateVariant(variant.key, { color: event.target.value || undefined })} /></label><label>Color visual<input type="color" value={variant.colorHex ?? "#ffffff"} onChange={(event) => updateVariant(variant.key, { colorHex: event.target.value })} /></label><label>Talla / capacidad<input value={variant.size ?? ""} onChange={(event) => updateVariant(variant.key, { size: event.target.value || undefined })} /></label><label>Material<input value={variant.material ?? ""} onChange={(event) => updateVariant(variant.key, { material: event.target.value || undefined })} /></label><label>Técnica<input value={variant.technique ?? ""} onChange={(event) => updateVariant(variant.key, { technique: event.target.value || undefined })} /></label><label>Ajuste de precio<input type="number" value={variant.priceModifier} onChange={(event) => updateVariant(variant.key, { priceModifier: Number(event.target.value) })} /></label><label>Unidades<input type="number" min="0" value={variant.quantity} onChange={(event) => updateVariant(variant.key, { quantity: Number(event.target.value) })} /></label><label className="check-field"><input type="checkbox" checked={variant.active} onChange={(event) => updateVariant(variant.key, { active: event.target.checked })} /> Disponible</label><label className="check-field"><input type="checkbox" checked={variant.trackInventory} onChange={(event) => updateVariant(variant.key, { trackInventory: event.target.checked })} /> Controlar inventario</label></div></article>)}</div><button className="button button-secondary" type="button" onClick={() => setVariants((current) => [...current, newVariant(current.length)])}><Plus size={17} /> Agregar variante</button></section>

    <section className="builder-section"><div className="builder-section-title"><span>04</span><div><h2>Fotografías</h2><p>La primera imagen es la portada del producto y de Diseños listos.</p></div></div><AdminImageUploader label="Agregar fotografía" hint="PNG, JPG o WEBP, máximo 12 MB." onUploaded={addGallery} />{gallery.length > 0 && <div className="admin-gallery-list">{gallery.map((image, index) => <div key={image.key}><Image src={image.url} alt={image.name} width={image.width} height={image.height} /><span>{index === 0 ? "Portada" : `Galería ${index + 1}`}</span><button type="button" onClick={() => setGallery((current) => current.filter((item) => item.key !== image.key))}><Trash2 size={15} /></button></div>)}</div>}</section>

    <section className="builder-section"><div className="builder-section-title"><span>05</span><div><h2>Vistas, formas y zonas de diseño</h2><p>Controla frente, espalda, mangas, envolvente y zonas especiales. Cada vista puede tener varias áreas.</p></div></div><div className="admin-mockup-list">{mockups.map((mockup, mockupIndex) => {
      const selectedArea = mockup.areas.find((area) => area.key === mockup.selectedAreaKey) ?? mockup.areas[0]!;
      const firstExclusion = selectedArea.exclusions[0];
      return <article className="admin-mockup-editor" key={mockup.key}><div className="admin-mockup-head"><div><span>Vista {mockupIndex + 1}</span><h3>{mockup.name}</h3></div>{mockups.length > 1 && <button type="button" onClick={() => setMockups((current) => current.filter((item) => item.key !== mockup.key))}><Trash2 size={16} /> Quitar vista</button>}</div><div className="admin-mockup-grid"><div>
        {mockup.imageUrl && <div className="admin-current-mockup"><Image src={mockup.imageUrl} alt={mockup.name} width={mockup.widthPx} height={mockup.heightPx} /><span>Imagen base actual</span></div>}
        <AdminImageUploader label={mockup.imageUrl ? "Reemplazar imagen base" : "Cargar imagen base"} hint="Usa el producto vacío y centrado." onUploaded={(asset) => updateMockup(mockup.key, (current) => ({ ...current, assetId: asset.id, imageUrl: asset.url, widthPx: asset.width, heightPx: asset.height }))} />
        {mockup.imageUrl && <VisualAreaCalibrator src={mockup.imageUrl} alt={`Previsualización de ${mockup.name}`} width={mockup.widthPx} height={mockup.heightPx} area={selectedArea} shape={selectedArea.shape} onAreaChange={(next) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, ...next }))} exclusion={firstExclusion} exclusionRadius={firstExclusion?.radius} onExclusionChange={firstExclusion ? (next) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, ...next } : item) })) : undefined} />}
      </div><div className="admin-area-controls"><div className="form-grid"><label>Nombre de vista<input value={mockup.name} onChange={(event) => updateMockup(mockup.key, (current) => ({ ...current, name: event.target.value }))} /></label><label>Orientación<select value={mockup.view} onChange={(event) => updateMockup(mockup.key, (current) => ({ ...current, view: event.target.value as MockupView }))}>{Object.entries(viewLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        <div className="admin-area-tabs">{mockup.areas.map((area) => <button type="button" className={area.key === selectedArea.key ? "active" : ""} key={area.key} onClick={() => updateMockup(mockup.key, (current) => ({ ...current, selectedAreaKey: area.key }))}>{area.name}</button>)}<button type="button" onClick={() => updateMockup(mockup.key, (current) => { const area = newArea(current.areas.length); return { ...current, areas: [...current.areas, area], selectedAreaKey: area.key }; })}><Plus size={14} /> Área</button></div>
        <div className="form-grid"><label>Nombre del área<input value={selectedArea.name} onChange={(event) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, name: event.target.value }))} /></label><label>Forma<select value={selectedArea.shape} onChange={(event) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, shape: event.target.value as AreaShape }))}>{Object.entries(shapeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
        <p className="admin-control-label">Posición y tamaño del área</p><div className="admin-coordinate-grid"><NumberField label="X" value={selectedArea.x} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, x: value }))} /><NumberField label="Y" value={selectedArea.y} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, y: value }))} /><NumberField label="Ancho" value={selectedArea.width} min={.1} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, width: value }))} /><NumberField label="Alto" value={selectedArea.height} min={.1} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, height: value }))} /><NumberField label="Ancho real" suffix="cm" max={300} value={selectedArea.realWidthCm} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, realWidthCm: value }))} /><NumberField label="Alto real" suffix="cm" max={300} value={selectedArea.realHeightCm} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, realHeightCm: value }))} /></div>
        <label className="check-field"><input type="checkbox" checked={selectedArea.allowOverflow} onChange={(event) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, allowOverflow: event.target.checked }))} /> Permitir diseño fuera del área</label><label className="check-field"><input type="checkbox" checked={Boolean(firstExclusion)} onChange={(event) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: event.target.checked ? [{ key: key(), name: "Zona protegida", x: 35, y: 5, width: 20, height: 20, radius: 8 }] : [] }))} /> Proteger cámara, asa o costura</label>
        {firstExclusion && <><label className="admin-exclusion-name">Nombre de zona protegida<input value={firstExclusion.name} onChange={(event) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, name: event.target.value } : item) }))} /></label><div className="admin-coordinate-grid"><NumberField label="X" value={firstExclusion.x} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, x: value } : item) }))} /><NumberField label="Y" value={firstExclusion.y} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, y: value } : item) }))} /><NumberField label="Ancho" value={firstExclusion.width} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, width: value } : item) }))} /><NumberField label="Alto" value={firstExclusion.height} onChange={(value) => updateArea(mockup.key, selectedArea.key, (area) => ({ ...area, exclusions: area.exclusions.map((item, index) => index === 0 ? { ...item, height: value } : item) }))} /></div></>}
        <div className="admin-area-actions">{mockup.areas.length > 1 && <button type="button" onClick={() => updateMockup(mockup.key, (current) => { const areas = current.areas.filter((area) => area.key !== selectedArea.key); return { ...current, areas, selectedAreaKey: areas[0]!.key }; })}><Trash2 size={15} /> Quitar área</button>}</div>
      </div></div></article>;
    })}</div><button className="button button-secondary" type="button" onClick={() => setMockups((current) => [...current, newMockup(current.length)])}><ImagePlus size={17} /> Agregar vista</button></section>

    <div className="builder-submit"><div>{message && <p className={saved ? "admin-success" : "inline-alert"}>{message}</p>}{saved && <Link href={`/productos/${initial.slug}`} target="_blank"><Eye size={16} /> Ver producto</Link>}</div><div><Link className="button button-secondary" href="/admin/productos">Volver</Link><button className="button button-gradient" disabled={busy}><Save size={17} /> {busy ? "Guardando…" : "Guardar todos los cambios"}</button></div></div>
    <p className="builder-security"><Shapes size={16} /> Los cambios afectan las vistas que utilizarán los clientes nuevos. Los pedidos existentes conservan su diseño guardado.</p>
  </form>;
}
