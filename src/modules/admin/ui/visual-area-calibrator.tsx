"use client";

import Image from "next/image";
import { Move, Scaling } from "lucide-react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { resizeVisualRect, type VisualRect, type VisualResizeMode } from "@/src/modules/admin/domain/visual-calibration";

type DragState = { pointerId: number; target: "area" | "exclusion"; mode: VisualResizeMode; startX: number; startY: number; rect: VisualRect };

function Rectangle({ kind, value, radius, shape = "RECTANGLE", onChange, onStart }: { kind: "area" | "exclusion"; value: VisualRect; radius?: number; shape?: "RECTANGLE" | "ROUNDED" | "CIRCLE"; onChange: (value: VisualRect) => void; onStart: (event: PointerEvent<HTMLElement>, target: "area" | "exclusion", mode: VisualResizeMode) => void }) {
  const label = kind === "area" ? "Área editable" : "Cámara protegida";
  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.shiftKey ? 2 : .5;
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    onChange(resizeVisualRect(value, "move", dx, dy));
  }
  return <div
    className={`visual-calibration-rect visual-calibration-${kind}`}
    style={{ left: `${value.x}%`, top: `${value.y}%`, width: `${value.width}%`, height: `${value.height}%`, borderRadius: kind === "exclusion" ? `${radius ?? 0}px` : shape === "CIRCLE" ? "50%" : shape === "ROUNDED" ? "20px" : undefined }}
    role="button"
    tabIndex={0}
    aria-label={`${label}. Arrastra para mover; usa las esquinas para cambiar el tamaño.`}
    onKeyDown={moveWithKeyboard}
    onPointerDown={(event) => onStart(event, kind, "move")}
  >
    <span className="visual-calibration-label"><Move size={12} /> {label}</span>
    {(["nw", "ne", "sw", "se"] as const).map((mode) => <span key={mode} className={`visual-resize-handle handle-${mode}`} aria-hidden="true" onPointerDown={(event) => { event.stopPropagation(); onStart(event, kind, mode); }} />)}
  </div>;
}

export function VisualAreaCalibrator({ src, alt, width, height, area, shape = "RECTANGLE", onAreaChange, exclusion, exclusionRadius, onExclusionChange }: { src: string; alt: string; width: number; height: number; area: VisualRect; shape?: "RECTANGLE" | "ROUNDED" | "CIRCLE"; onAreaChange: (value: VisualRect) => void; exclusion?: VisualRect; exclusionRadius?: number; onExclusionChange?: (value: VisualRect) => void }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function startDrag(event: PointerEvent<HTMLElement>, target: "area" | "exclusion", mode: VisualResizeMode) {
    event.preventDefault();
    const value = target === "area" ? area : exclusion;
    if (!value) return;
    dragRef.current = { pointerId: event.pointerId, target, mode, startX: event.clientX, startY: event.clientY, rect: value };
    previewRef.current?.setPointerCapture(event.pointerId);
  }

  function updateDrag(event: PointerEvent<HTMLDivElement>) {
    const active = dragRef.current;
    const preview = previewRef.current;
    if (!active || !preview || active.pointerId !== event.pointerId) return;
    const bounds = preview.getBoundingClientRect();
    const next = resizeVisualRect(active.rect, active.mode, ((event.clientX - active.startX) / bounds.width) * 100, ((event.clientY - active.startY) / bounds.height) * 100);
    if (active.target === "area") onAreaChange(next); else onExclusionChange?.(next);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (previewRef.current?.hasPointerCapture(event.pointerId)) previewRef.current.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  return <div className="visual-calibrator-shell">
    <div className="visual-calibrator-help"><Scaling size={17} /><span><strong>Ajuste visual con el mouse</strong>Arrastra cada cuadro para moverlo y sus esquinas para cambiar el tamaño.</span></div>
    <div ref={previewRef} className="admin-mockup-preview case-activation-preview visual-calibrator" style={{ aspectRatio: `${width}/${height}` }} onPointerMove={updateDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
      <Image src={src} alt={alt} fill sizes="520px" draggable={false} />
      <Rectangle kind="area" value={area} shape={shape} onChange={onAreaChange} onStart={startDrag} />
      {exclusion && onExclusionChange && <Rectangle kind="exclusion" value={exclusion} radius={exclusionRadius} onChange={onExclusionChange} onStart={startDrag} />}
    </div>
  </div>;
}
