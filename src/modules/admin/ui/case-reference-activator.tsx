"use client";

import { CheckCircle2, ExternalLink, ScanLine, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminImageUploader, type AdminUploadedAsset } from "@/src/modules/admin/ui/admin-image-uploader";
import { detectCameraExclusionFromAlpha } from "@/src/modules/admin/domain/camera-exclusion-detection";
import { VisualAreaCalibrator } from "@/src/modules/admin/ui/visual-area-calibrator";

type AreaDraft = { name: string; x: number; y: number; width: number; height: number; realWidthCm: number; realHeightCm: number };
type ExclusionDraft = { enabled: boolean; name: string; x: number; y: number; width: number; height: number; radius: number };

function NumberField({ label, value, suffix = "%", min = 0, max = 100, onChange }: { label: string; value: number; suffix?: string; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label>{label}<span><input type="number" value={value} min={min} max={max} step="0.1" onChange={(event) => onChange(Number(event.target.value))} /><small>{suffix}</small></span></label>;
}

export function CaseReferenceActivator({ product }: { product: { id: string; name: string; slug: string; brand?: string; series?: string; deviceModel?: string } }) {
  const router = useRouter();
  const [asset, setAsset] = useState<AdminUploadedAsset>();
  const [area, setArea] = useState<AreaDraft>({ name: "Área posterior", x: 18, y: 7, width: 64, height: 86, realWidthCm: 7.2, realHeightCm: 15.2 });
  const [exclusion, setExclusion] = useState<ExclusionDraft>({ enabled: true, name: "Cámara", x: 20, y: 8, width: 25, height: 22, radius: 8 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState("");

  async function detectCamera(assetToAnalyze = asset) {
    if (!assetToAnalyze) return;
    setDetectionMessage("Analizando transparencia del mockup…");
    try {
      const image = new window.Image(); image.crossOrigin = "anonymous"; image.src = assetToAnalyze.url;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo leer la imagen")); });
      const maxSide = 320; const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(20, Math.round(image.naturalWidth * scale)); const height = Math.max(20, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) throw new Error("El navegador no permitió analizar la imagen");
      context.drawImage(image, 0, 0, width, height);
      const rgba = context.getImageData(0, 0, width, height).data; const alpha = new Uint8Array(width * height);
      for (let index = 0; index < alpha.length; index += 1) alpha[index] = rgba[index * 4 + 3]!;
      const detected = detectCameraExclusionFromAlpha(width, height, alpha);
      if (!detected) { setDetectionMessage("No encontré un recorte transparente de cámara. Ajusta el área rosada manualmente o usa un PNG transparente."); return; }
      setExclusion((current) => ({ ...current, enabled: true, x: detected.x, y: detected.y, width: detected.width, height: detected.height, radius: Math.max(4, Math.round(Math.min(detected.width, detected.height) * .28)) }));
      setDetectionMessage(`Cámara detectada (${detected.confidence === "HIGH" ? "confianza alta" : "revisar posición"}). Confirma el borde rosado antes de publicar.`);
    } catch (error) { setDetectionMessage(error instanceof Error ? error.message : "No se pudo analizar el mockup"); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!asset) { setMessage("Primero sube el mockup exacto de esta referencia"); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/activate-case`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId: asset.id, widthPx: asset.width, heightPx: asset.height, area, exclusion: exclusion.enabled ? { name: exclusion.name, x: exclusion.x, y: exclusion.y, width: exclusion.width, height: exclusion.height, radius: exclusion.radius } : undefined }) });
      const body = await response.json() as { product?: { slug: string }; message?: string; issues?: Array<{ path: string; message: string }> };
      if (!response.ok || !body.product) throw new Error(body.issues?.[0] ? `${body.issues[0].path}: ${body.issues[0].message}` : body.message ?? "No pudimos publicar la referencia");
      setPublished(true);
      setMessage(body.message ?? "Referencia publicada");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos publicar la referencia");
    } finally {
      setBusy(false);
    }
  }

  return <form className="catalog-builder" onSubmit={submit}>
    <section className="builder-section"><div className="builder-section-title"><span>01</span><div><h2>Mockup exacto</h2><p>Usa una imagen limpia de la carcasa correspondiente a {product.deviceModel ?? product.name}; no una plantilla genérica.</p></div></div><AdminImageUploader label="Imagen base de la carcasa" hint="Para detectar la cámara automáticamente usa PNG o WEBP con el recorte transparente. JPG requiere calibración manual." value={asset} onUploaded={(uploaded) => { setAsset(uploaded); void detectCamera(uploaded); }} onRemove={() => { setAsset(undefined); setDetectionMessage(""); }} />{asset && <><button className="button button-secondary admin-detect-camera" type="button" onClick={() => void detectCamera()}><ScanLine size={17} /> Detectar cámara automáticamente</button>{detectionMessage && <p className="admin-detection-message" role="status">{detectionMessage}</p>}<VisualAreaCalibrator src={asset.url} alt={`Mockup de ${product.name}`} width={asset.width} height={asset.height} area={area} onAreaChange={(next) => setArea((current) => ({ ...current, ...next }))} exclusion={exclusion.enabled ? exclusion : undefined} exclusionRadius={exclusion.radius} onExclusionChange={(next) => setExclusion((current) => ({ ...current, ...next }))} /></>}</section>
    <section className="builder-section"><div className="builder-section-title"><span>02</span><div><h2>Medidas y ajuste fino</h2><p>Los valores cambian automáticamente cuando mueves los cuadros. Aquí puedes afinar una medida exacta si la necesitas.</p></div></div><div className="admin-area-controls"><label className="admin-exclusion-name">Nombre del área<input value={area.name} onChange={(event) => setArea((current) => ({ ...current, name: event.target.value }))} /></label><div className="admin-coordinate-grid"><NumberField label="X" value={area.x} onChange={(value) => setArea((current) => ({ ...current, x: value }))} /><NumberField label="Y" value={area.y} onChange={(value) => setArea((current) => ({ ...current, y: value }))} /><NumberField label="Ancho" value={area.width} min={.1} onChange={(value) => setArea((current) => ({ ...current, width: value }))} /><NumberField label="Alto" value={area.height} min={.1} onChange={(value) => setArea((current) => ({ ...current, height: value }))} /><NumberField label="Ancho real" value={area.realWidthCm} suffix="cm" min={.1} max={100} onChange={(value) => setArea((current) => ({ ...current, realWidthCm: value }))} /><NumberField label="Alto real" value={area.realHeightCm} suffix="cm" min={.1} max={100} onChange={(value) => setArea((current) => ({ ...current, realHeightCm: value }))} /></div><label className="check-field"><input type="checkbox" checked={exclusion.enabled} onChange={(event) => setExclusion((current) => ({ ...current, enabled: event.target.checked }))} /> Proteger la zona de cámara</label>{exclusion.enabled && <><label className="admin-exclusion-name">Nombre de exclusión<input value={exclusion.name} onChange={(event) => setExclusion((current) => ({ ...current, name: event.target.value }))} /></label><div className="admin-coordinate-grid"><NumberField label="X" value={exclusion.x} onChange={(value) => setExclusion((current) => ({ ...current, x: value }))} /><NumberField label="Y" value={exclusion.y} onChange={(value) => setExclusion((current) => ({ ...current, y: value }))} /><NumberField label="Ancho" value={exclusion.width} min={.1} onChange={(value) => setExclusion((current) => ({ ...current, width: value }))} /><NumberField label="Alto" value={exclusion.height} min={.1} onChange={(value) => setExclusion((current) => ({ ...current, height: value }))} /><NumberField label="Radio" value={exclusion.radius} suffix="px" max={50} onChange={(value) => setExclusion((current) => ({ ...current, radius: value }))} /></div></>}</div></section>
    <div className="builder-submit"><div>{message && <p className={published ? "admin-success" : "inline-alert"}>{published && <CheckCircle2 size={15} />} {message}</p>}{published && <Link href={`/productos/${product.slug}`} target="_blank">Ver producto publicado <ExternalLink size={14} /></Link>}</div><div><Link className="button button-secondary" href="/admin/productos">Cancelar</Link><button className="button button-gradient" disabled={busy || !asset}><Save size={17} /> {busy ? "Publicando…" : "Publicar referencia"}</button></div></div>
  </form>;
}
