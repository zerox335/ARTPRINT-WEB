"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

export type AdminUploadedAsset = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
};

export function AdminImageUploader({ label, hint, value, onUploaded, onRemove }: { label: string; hint: string; value?: AdminUploadedAsset; onUploaded: (asset: AdminUploadedAsset) => void; onRemove?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const body = await response.json() as { asset?: { id: string; url: string; mimeType: string; width?: number; height?: number }; message?: string };
      if (!response.ok || !body.asset?.width || !body.asset.height) throw new Error(body.message ?? "No pudimos subir la imagen");
      onUploaded({ ...body.asset, name: file.name, width: body.asset.width, height: body.asset.height });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-uploader">
      <div className="admin-uploader-heading"><strong>{label}</strong><small>{hint}</small></div>
      {value ? <div className="admin-uploaded-image"><Image src={value.url} alt={`Vista previa de ${value.name}`} width={value.width} height={value.height} /><div><strong>{value.name}</strong><small>{value.width} × {value.height} px</small></div>{onRemove && <button type="button" onClick={onRemove} aria-label={`Quitar ${value.name}`}><Trash2 size={17} /></button>}</div> : <button className="admin-upload-trigger" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle className="spin-icon" size={20} /> : <ImagePlus size={20} />}<span>{uploading ? "Subiendo imagen segura…" : "Seleccionar PNG, JPG o WEBP"}</span></button>}
      <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(event) => void upload(event.target.files?.[0])} />
      {error && <p className="inline-alert" role="alert">{error}</p>}
    </div>
  );
}
