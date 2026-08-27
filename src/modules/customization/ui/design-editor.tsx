"use client";

import Konva from "konva";
import NextImage from "next/image";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import { AlignCenter, BringToFront, Copy, Frame, ImagePlus, Layers3, Minus, MousePointer2, Palette, Plus, RotateCcw, SendToBack, Sparkles, Trash2, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PrintAreaView, ProductView } from "@/src/modules/catalog/domain/catalog";
import type { CustomizationSpec } from "@/src/modules/customization/domain/customization";

type EditorElement =
  | { id: string; type: "TEXT"; printAreaId: string; x: number; y: number; width: number; height: number; scaleX: number; scaleY: number; rotation: number; layerIndex: number; content: string; fontFamily: "Inter" | "Arial" | "Georgia" | "Courier New" | "Trebuchet MS"; fill: string; align: "left" | "center" | "right" }
  | { id: string; type: "IMAGE"; printAreaId: string; x: number; y: number; width: number; height: number; scaleX: number; scaleY: number; rotation: number; layerIndex: number; assetId: string; originalStorageKey: string; sourceUrl: string };

type SampleTemplate = { id: string; name: string; preview: string; content: string; fontFamily: Extract<EditorElement, { type: "TEXT" }>["fontFamily"]; fill: string; background: string };

const sampleTemplates: Record<"carcasas" | "textiles" | "general", SampleTemplate[]> = {
  carcasas: [
    { id: "case-initials", name: "Iniciales", preview: "DG", content: "D G", fontFamily: "Georgia", fill: "#f7f2ea", background: "linear-gradient(135deg,#15171b,#806df0)" },
    { id: "case-mode", name: "Modo ON", preview: "MODO\nON", content: "MODO\nON", fontFamily: "Inter", fill: "#20232a", background: "linear-gradient(135deg,#67e4c9,#f4fffb)" },
    { id: "case-style", name: "Mi estilo", preview: "MI\nESTILO", content: "MI\nESTILO", fontFamily: "Trebuchet MS", fill: "#ffffff", background: "linear-gradient(135deg,#ff4f9a,#ffb15c)" },
  ],
  textiles: [
    { id: "tee-urban", name: "Urban 18", preview: "URBAN\n18", content: "URBAN\n18", fontFamily: "Inter", fill: "#f8f4ed", background: "linear-gradient(135deg,#20232a,#555b66)" },
    { id: "tee-team", name: "Mi equipo", preview: "EQUIPO", content: "MI EQUIPO", fontFamily: "Trebuchet MS", fill: "#172c70", background: "linear-gradient(135deg,#d9e5ff,#ffffff)" },
    { id: "tee-birthday", name: "Cumpleaños", preview: "FELIZ\nCUMPLE", content: "FELIZ\nCUMPLE", fontFamily: "Georgia", fill: "#a51f57", background: "linear-gradient(135deg,#ffe0ed,#fff5bd)" },
  ],
  general: [
    { id: "gift-mom", name: "Mejor mamá", preview: "MEJOR\nMAMÁ", content: "MEJOR\nMAMÁ", fontFamily: "Georgia", fill: "#a51f57", background: "linear-gradient(135deg,#ffe0ed,#fff)" },
    { id: "gift-coffee", name: "Café e ideas", preview: "CAFÉ &\nIDEAS", content: "CAFÉ &\nIDEAS", fontFamily: "Inter", fill: "#4b2d1f", background: "linear-gradient(135deg,#eac9a5,#fff2d8)" },
    { id: "gift-name", name: "Nombre", preview: "TU\nNOMBRE", content: "TU NOMBRE", fontFamily: "Trebuchet MS", fill: "#173b77", background: "linear-gradient(135deg,#d8efff,#f5fbff)" },
  ],
};

function useHtmlImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) return;
    const next = new window.Image();
    next.crossOrigin = "anonymous";
    next.onload = () => setImage(next);
    next.src = src;
    return () => { next.onload = null; };
  }, [src]);
  return image;
}

function EditorImage({ element, selected, onSelect, onChange, bounds }: { element: Extract<EditorElement, { type: "IMAGE" }>; selected: boolean; onSelect: () => void; onChange: (updates: Partial<EditorElement>) => void; bounds: { x: number; y: number; width: number; height: number } }) {
  const image = useHtmlImage(element.sourceUrl);
  const nodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  useEffect(() => { if (selected && nodeRef.current && transformerRef.current) { transformerRef.current.nodes([nodeRef.current]); transformerRef.current.getLayer()?.batchDraw(); } }, [selected]);
  return <>{image && <KonvaImage ref={nodeRef} image={image} {...element} draggable dragBoundFunc={(position) => ({ x: Math.max(bounds.x, Math.min(bounds.x + bounds.width - 20, position.x)), y: Math.max(bounds.y, Math.min(bounds.y + bounds.height - 20, position.y)) })} onClick={onSelect} onTap={onSelect} onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })} onTransformEnd={() => { const node = nodeRef.current; if (node) onChange({ x: node.x(), y: node.y(), scaleX: Math.max(.1, node.scaleX()), scaleY: Math.max(.1, node.scaleY()), rotation: node.rotation() }); }} />}{selected && <Transformer ref={transformerRef} rotateEnabled flipEnabled={false} anchorSize={20} borderStrokeWidth={2} rotateAnchorOffset={32} boundBoxFunc={(oldBox, newBox) => newBox.width < 25 || newBox.height < 25 ? oldBox : newBox} />}</>;
}

function EditorText({ element, selected, onSelect, onChange, bounds }: { element: Extract<EditorElement, { type: "TEXT" }>; selected: boolean; onSelect: () => void; onChange: (updates: Partial<EditorElement>) => void; bounds: { x: number; y: number; width: number; height: number } }) {
  const nodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  useEffect(() => { if (selected && nodeRef.current && transformerRef.current) { transformerRef.current.nodes([nodeRef.current]); transformerRef.current.getLayer()?.batchDraw(); } }, [selected]);
  return <><Text ref={nodeRef} {...element} fontSize={30} fontStyle="bold" verticalAlign="middle" draggable dragBoundFunc={(position) => ({ x: Math.max(bounds.x, Math.min(bounds.x + bounds.width - 20, position.x)), y: Math.max(bounds.y, Math.min(bounds.y + bounds.height - 20, position.y)) })} onClick={onSelect} onTap={onSelect} onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })} onTransformEnd={() => { const node = nodeRef.current; if (node) onChange({ x: node.x(), y: node.y(), scaleX: Math.max(.1, node.scaleX()), scaleY: Math.max(.1, node.scaleY()), rotation: node.rotation() }); }} />{selected && <Transformer ref={transformerRef} flipEnabled={false} anchorSize={20} borderStrokeWidth={2} rotateAnchorOffset={32} />}</>;
}

export default function DesignEditor({ product, area, variantColor, onChange }: { product: ProductView; area: PrintAreaView; variantColor?: string; onChange: (elements: CustomizationSpec["elements"]) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const height = Math.round(width * 1.125);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("TU IDEA");
  const [font, setFont] = useState<Extract<EditorElement, { type: "TEXT" }>["fontFamily"]>("Inter");
  const [fill, setFill] = useState("#20232a");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activeTool, setActiveTool] = useState<"IMAGE" | "TEXT" | "DESIGNS" | "LAYERS">("IMAGE");
  const isDrinkware = product.categorySlug === "mugs-termos";

  useEffect(() => {
    if (!wrapRef.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(Math.min(600, Math.floor(entry.contentRect.width))); });
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);
  const areaRect = useMemo(() => ({ x: (area.x / 100) * width, y: (area.y / 100) * height, width: (area.width / 100) * width, height: (area.height / 100) * height }), [area, width, height]);
  const movementBounds = useMemo(() => area.allowOverflow ? { x: 0, y: 0, width, height } : areaRect, [area.allowOverflow, areaRect, height, width]);
  const exclusionRects = useMemo(() => (area.exclusions ?? []).map((exclusion) => ({
    ...exclusion,
    x: (exclusion.x / 100) * width,
    y: (exclusion.y / 100) * height,
    width: (exclusion.width / 100) * width,
    height: (exclusion.height / 100) * height,
    cornerRadius: ((exclusion.radius ?? 0) / 100) * width,
  })), [area.exclusions, width, height]);
  const clipPrintableArea = useMemo(() => (context: Konva.Context) => {
    context.rect(areaRect.x, areaRect.y, areaRect.width, areaRect.height);
    for (const exclusion of exclusionRects) {
      context.moveTo(exclusion.x, exclusion.y);
      context.lineTo(exclusion.x, exclusion.y + exclusion.height);
      context.lineTo(exclusion.x + exclusion.width, exclusion.y + exclusion.height);
      context.lineTo(exclusion.x + exclusion.width, exclusion.y);
      context.closePath();
    }
    return ["evenodd"] as [CanvasFillRule];
  }, [areaRect, exclusionRects]);
  useEffect(() => {
    onChange(elements.map((element) => {
      if (element.type === "TEXT") return element;
      return Object.fromEntries(Object.entries(element).filter(([key]) => key !== "sourceUrl"));
    }) as CustomizationSpec["elements"]);
  }, [elements, onChange]);
  function addText() {
    const id = crypto.randomUUID();
    setElements((current) => [...current, { id, type: "TEXT", printAreaId: area.id, x: areaRect.x + 16, y: areaRect.y + areaRect.height / 2 - 25, width: Math.max(100, areaRect.width - 32), height: 55, scaleX: 1, scaleY: 1, rotation: 0, layerIndex: current.length, content: text || "TU IDEA", fontFamily: font, fill, align: "center" }]);
    setSelectedId(id);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await response.json() as { asset?: { id: string; url: string; width?: number; height?: number }; message?: string };
      if (!response.ok || !data.asset) throw new Error(data.message ?? "No pudimos cargar la imagen");
      const sourceUrl = URL.createObjectURL(file);
      const naturalRatio = (data.asset.width ?? 1) / (data.asset.height ?? 1);
      const targetWidth = isDrinkware ? areaRect.width * .9 : Math.min(areaRect.width * .72, 180);
      const id = crypto.randomUUID();
      setElements((current) => [...current, { id, type: "IMAGE", printAreaId: area.id, x: areaRect.x + (areaRect.width - targetWidth) / 2, y: areaRect.y + areaRect.height * .2, width: targetWidth, height: targetWidth / naturalRatio, scaleX: 1, scaleY: 1, rotation: 0, layerIndex: current.length, assetId: data.asset!.id, originalStorageKey: "server-canonicalized", sourceUrl }]);
      setSelectedId(id);
    } catch (error) { setUploadError((error as Error).message); } finally { setUploading(false); }
  }

  function updateElement(id: string, updates: Partial<EditorElement>) { setElements((current) => current.map((element) => element.id === id ? { ...element, ...updates } as EditorElement : element)); }
  function removeSelected() { if (selectedId) { setElements((current) => current.filter((element) => element.id !== selectedId)); setSelectedId(null); } }
  function duplicateSelected() { const selected = elements.find((element) => element.id === selectedId); if (!selected) return; const id = crypto.randomUUID(); setElements((current) => [...current, { ...selected, id, x: selected.x + 12, y: selected.y + 12, layerIndex: current.length }]); setSelectedId(id); }
  function moveLayer(direction: "front" | "back") { if (!selectedId) return; setElements((current) => { const selected = current.find((element) => element.id === selectedId); if (!selected) return current; const rest = current.filter((element) => element.id !== selectedId); const ordered = direction === "front" ? [...rest, selected] : [selected, ...rest]; return ordered.map((element, index) => ({ ...element, layerIndex: index })); }); }
  function centerSelected() { const selected = elements.find((element) => element.id === selectedId); if (selected) updateElement(selected.id, { x: areaRect.x + (areaRect.width - selected.width * selected.scaleX) / 2, y: areaRect.y + (areaRect.height - selected.height * selected.scaleY) / 2 }); }
  function setSelectedScale(percent: number) { if (!selectedId) return; const scale = Math.min(12, Math.max(.1, percent / 100)); updateElement(selectedId, { scaleX: scale, scaleY: scale }); }
  function fitSelected(mode: "contain" | "cover") {
    const selected = elements.find((element) => element.id === selectedId && element.printAreaId === area.id); if (!selected) return;
    const horizontal = areaRect.width / selected.width; const vertical = areaRect.height / selected.height;
    const scale = Math.min(12, Math.max(.1, mode === "contain" ? Math.min(horizontal, vertical) : Math.max(horizontal, vertical)));
    updateElement(selected.id, { scaleX: scale, scaleY: scale, x: areaRect.x + (areaRect.width - selected.width * scale) / 2, y: areaRect.y + (areaRect.height - selected.height * scale) / 2 });
  }
  function applySample(template: SampleTemplate) {
    const id = crypto.randomUUID(); const width = Math.max(90, areaRect.width * .82); const height = Math.min(120, Math.max(65, areaRect.height * .28));
    setElements((current) => [...current, { id, type: "TEXT", printAreaId: area.id, x: areaRect.x + (areaRect.width - width) / 2, y: areaRect.y + (areaRect.height - height) / 2, width, height, scaleX: 1, scaleY: 1, rotation: 0, layerIndex: current.length, content: template.content, fontFamily: template.fontFamily, fill: template.fill, align: "center" }]);
    setText(template.content); setFont(template.fontFamily); setFill(template.fill); setSelectedId(id);
  }

  const visible = elements.filter((element) => element.printAreaId === area.id).sort((a, b) => a.layerIndex - b.layerIndex);
  const selectedElement = elements.find((element) => element.id === selectedId && element.printAreaId === area.id);
  const selectedScale = selectedElement ? Math.round(((selectedElement.scaleX + selectedElement.scaleY) / 2) * 100) : 100;
  const isPhoneCase = product.categorySlug === "carcasas";
  const templates = sampleTemplates[isPhoneCase ? "carcasas" : product.categorySlug === "textiles" ? "textiles" : "general"];
  const isColorableTextile = product.categorySlug === "textiles" && Boolean(variantColor);
  const textileMask = area.mockupImageUrl ?? product.imageUrl;
  const textileColorStyle = isColorableTextile ? { backgroundColor: variantColor, maskImage: `url(${textileMask})`, WebkitMaskImage: `url(${textileMask})`, ...(area.mirrorMockup ? { transform: "scaleX(-1)" } : {}) } as CSSProperties : undefined;
  const drinkwarePreviewStyle = isDrinkware ? {
    "--print-left": `${area.x}%`,
    "--print-top": `${area.y}%`,
    "--print-width": `${area.width}%`,
    "--print-height": `${area.height}%`,
  } as CSSProperties : undefined;
  const scaleControl = <div className="element-scale-control"><span>Tamaño</span><button type="button" onClick={() => setSelectedScale(selectedScale - 10)} disabled={!selectedElement || selectedScale <= 10} aria-label="Reducir elemento"><Minus size={15} /></button><input type="range" min="10" max="1200" step="5" value={selectedScale} disabled={!selectedElement} onChange={(event) => setSelectedScale(Number(event.target.value))} aria-label="Tamaño del elemento seleccionado" /><output>{selectedElement ? `${selectedScale}%` : "—"}</output><button type="button" onClick={() => setSelectedScale(selectedScale + 10)} disabled={!selectedElement || selectedScale >= 1200} aria-label="Agrandar elemento"><Plus size={15} /></button></div>;
  const fitControls = <div className="element-fit-actions"><button type="button" disabled={!selectedElement} onClick={() => fitSelected("contain")}><Frame size={15} /> Ajustar completo</button><button type="button" disabled={!selectedElement} onClick={() => fitSelected("cover")}><Sparkles size={15} /> Rellenar área</button></div>;
  const selectedTextEditor = selectedElement?.type === "TEXT" ? <div className="selected-text-editor"><label>Editar texto<input value={selectedElement.content} maxLength={300} onChange={(event) => updateElement(selectedElement.id, { content: event.target.value })} /></label><label>Fuente<select value={selectedElement.fontFamily} onChange={(event) => updateElement(selectedElement.id, { fontFamily: event.target.value as typeof selectedElement.fontFamily })}><option>Inter</option><option>Arial</option><option>Georgia</option><option>Courier New</option><option>Trebuchet MS</option></select></label><label>Color<input type="color" value={selectedElement.fill} onChange={(event) => updateElement(selectedElement.id, { fill: event.target.value })} /></label></div> : null;
  const samples = <div className="sample-design-grid">{templates.map((template) => <button type="button" key={template.id} onClick={() => applySample(template)} aria-label={`Usar diseño ${template.name}`}><span style={{ background: template.background, color: template.fill }}>{template.preview}</span><strong>{template.name}</strong><small>Usar y editar</small></button>)}</div>;
  const layerTools = <div className="layer-tools"><button onClick={duplicateSelected} disabled={!selectedElement} title="Duplicar"><Copy size={17} /></button><button onClick={centerSelected} disabled={!selectedElement} title="Centrar"><AlignCenter size={17} /></button><button onClick={() => moveLayer("front")} disabled={!selectedElement} title="Traer al frente"><BringToFront size={17} /></button><button onClick={() => moveLayer("back")} disabled={!selectedElement} title="Enviar atrás"><SendToBack size={17} /></button><button onClick={() => selectedElement && updateElement(selectedElement.id, { rotation: 0, scaleX: 1, scaleY: 1 })} disabled={!selectedElement} title="Restablecer transformación"><RotateCcw size={17} /></button><button className="danger-tool" onClick={removeSelected} disabled={!selectedElement} title="Eliminar"><Trash2 size={17} /></button></div>;
  const canvas = <>
    {uploadError && <p className="inline-alert" role="alert">{uploadError}</p>}
    <div className={`canvas-shell${isColorableTextile ? " textile-canvas" : ""}${isDrinkware ? " drinkware-canvas" : ""}`} ref={wrapRef}>
      <NextImage className={area.mirrorMockup ? "mockup-mirrored" : undefined} src={area.mockupImageUrl ?? product.imageUrl} alt={`Mockup de ${product.name}, ${area.name}`} fill sizes="(max-width: 940px) 100vw, 600px" priority />
      {textileColorStyle && <span className="textile-color-layer" style={textileColorStyle} aria-hidden="true" />}
      <Stage width={width} height={height} className="konva-stage" onMouseDown={(event) => { if (event.target === event.target.getStage()) setSelectedId(null); }} onTouchStart={(event) => { if (event.target === event.target.getStage()) setSelectedId(null); }}>
        <Layer listening={false}>
          <Rect {...areaRect} cornerRadius={isDrinkware ? areaRect.width * .12 : 0} fill="rgba(128,109,240,.06)" stroke="#806df0" strokeWidth={2} dash={[10, 8]} />
          {exclusionRects.map((exclusion) => <Rect key={exclusion.id} {...exclusion} fill="rgba(255,86,116,.13)" stroke="#ff5674" strokeWidth={2} dash={[6, 5]} />)}
        </Layer>
        <Layer clipFunc={area.allowOverflow ? undefined : clipPrintableArea}>{visible.map((element) => element.type === "IMAGE" ? <EditorImage key={element.id} element={element} selected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onChange={(updates) => updateElement(element.id, updates)} bounds={movementBounds} /> : <EditorText key={element.id} element={element} selected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onChange={(updates) => updateElement(element.id, updates)} bounds={movementBounds} />)}</Layer>
      </Stage>
      {isDrinkware && <span className="drinkware-curvature" style={drinkwarePreviewStyle} aria-hidden="true" />}
      <span className="print-area-label">{isDrinkware ? "Vista envolvente" : area.name} · {area.realWidthCm} × {area.realHeightCm} cm{area.allowOverflow ? " · edición libre" : ""}{exclusionRects.length ? " · cámara protegida" : ""}</span>
    </div>
  </>;

  if (isPhoneCase) return (
    <div className="design-editor case-design-editor">
      <div className="case-editor-header"><div><span>Mesa de diseño</span><strong>{product.deviceModel ?? product.name}</strong></div><p><MousePointer2 size={15} /> Arrastra, escala y gira sobre la carcasa</p></div>
      <div className="case-editor-grid">
        <div className="case-tool-rail" role="tablist" aria-label="Herramientas de la carcasa">
          <button role="tab" aria-selected={activeTool === "IMAGE"} className={activeTool === "IMAGE" ? "active" : ""} onClick={() => setActiveTool("IMAGE")}><ImagePlus size={21} /><span>Imagen</span></button>
          <button role="tab" aria-selected={activeTool === "TEXT"} className={activeTool === "TEXT" ? "active" : ""} onClick={() => setActiveTool("TEXT")}><Type size={21} /><span>Texto</span></button>
          <button role="tab" aria-selected={activeTool === "DESIGNS"} className={activeTool === "DESIGNS" ? "active" : ""} onClick={() => setActiveTool("DESIGNS")}><Palette size={21} /><span>Diseños</span></button>
          <button role="tab" aria-selected={activeTool === "LAYERS"} className={activeTool === "LAYERS" ? "active" : ""} onClick={() => setActiveTool("LAYERS")}><Layers3 size={21} /><span>Capas</span><small>{visible.length}</small></button>
        </div>
        <section className="case-tool-panel">
          {activeTool === "IMAGE" && <div className="case-tool-section"><p className="case-tool-kicker">Tu archivo original</p><h2>Añade una imagen</h2><p>Usa PNG con fondo transparente o una fotografía de buena resolución.</p><label className={uploading ? "case-upload-dropzone disabled" : "case-upload-dropzone"}><ImagePlus size={27} /><strong>{uploading ? "Subiendo archivo…" : "Seleccionar imagen"}</strong><span>PNG, JPG, WEBP o SVG seguro · máximo 12 MB</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" disabled={uploading} onChange={(event) => void uploadImage(event.target.files?.[0])} /></label></div>}
          {activeTool === "TEXT" && <div className="case-tool-section"><p className="case-tool-kicker">Mensaje personalizado</p><h2>Añade texto</h2><label>Contenido<input value={text} maxLength={100} onChange={(event) => setText(event.target.value)} /></label><label>Fuente<select value={font} onChange={(event) => setFont(event.target.value as typeof font)}><option>Inter</option><option>Arial</option><option>Georgia</option><option>Courier New</option><option>Trebuchet MS</option></select></label><label>Color<input className="case-color-input" type="color" value={fill} onChange={(event) => setFill(event.target.value)} /></label><button className="button button-gradient button-block" onClick={addText}><Type size={17} /> Añadir al diseño</button></div>}
          {activeTool === "DESIGNS" && <div className="case-tool-section"><p className="case-tool-kicker">Inspiración editable</p><h2>Diseños de muestra</h2><p>Elige uno como punto de partida y cambia texto, color, tamaño o posición.</p>{samples}</div>}
          {activeTool === "LAYERS" && <div className="case-tool-section"><p className="case-tool-kicker">Orden del diseño</p><h2>Capas</h2>{visible.length ? <div className="case-layer-list">{[...visible].reverse().map((element, index) => <button className={element.id === selectedId ? "active" : ""} key={element.id} onClick={() => setSelectedId(element.id)}><span>{element.type === "IMAGE" ? <ImagePlus size={16} /> : <Type size={16} />}{element.type === "IMAGE" ? `Imagen ${visible.length - index}` : element.content}</span><small>{element.id === selectedId ? "Seleccionada" : "Seleccionar"}</small></button>)}</div> : <div className="case-layers-empty"><Layers3 size={27} /><p>Aún no has añadido elementos.</p></div>}</div>}
          <div className="case-selection-tools"><span>{selectedElement ? "Editar selección" : "Selecciona un elemento"}</span>{selectedTextEditor}{scaleControl}{fitControls}{layerTools}</div>
        </section>
        <div className="case-canvas-column">{canvas}</div>
      </div>
      <p className="editor-hint">El borde morado marca el área imprimible y la zona rosada protege la cámara. La vista es una prueba; producción conserva el archivo original.</p>
    </div>
  );

  return (
    <div className="design-editor">
      <details className="sample-designs-drawer"><summary><Palette size={18} /><span><strong>Diseños de muestra</strong><small>Elige uno y personalízalo</small></span></summary>{samples}</details>
      <div className="editor-toolbar" aria-label="Herramientas de diseño">
        <div className="text-tool"><input value={text} maxLength={100} aria-label="Texto a agregar" onChange={(event) => setText(event.target.value)} /><select value={font} aria-label="Fuente" onChange={(event) => setFont(event.target.value as typeof font)}><option>Inter</option><option>Arial</option><option>Georgia</option><option>Courier New</option><option>Trebuchet MS</option></select><input type="color" value={fill} aria-label="Color del texto" onChange={(event) => setFill(event.target.value)} /><button onClick={addText} title="Agregar texto"><Type size={18} /><span>Texto</span></button></div>
        <label className={uploading ? "tool-button disabled" : "tool-button"}><ImagePlus size={18} /><span>{uploading ? "Subiendo…" : "Imagen"}</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" disabled={uploading} onChange={(event) => void uploadImage(event.target.files?.[0])} /></label>
        {layerTools}
      </div>
      {selectedTextEditor}
      {scaleControl}
      {fitControls}
      {canvas}
      <p className="editor-hint">{isDrinkware ? "La vista curva suavemente el diseño hacia los bordes para mostrar cómo se adapta al vaso. Es una simulación: producción usa tu archivo original plano con las medidas indicadas." : <>Arrastra la imagen y usa los puntos blancos de las esquinas para ampliarla, reducirla o girarla. {area.allowOverflow ? "Puedes extenderla fuera del borde morado y ajustarla sobre toda la prenda." : "El borde morado indica el área imprimible."} Las zonas rosadas están protegidas. Producción utiliza tu archivo original.</>}</p>
    </div>
  );
}
