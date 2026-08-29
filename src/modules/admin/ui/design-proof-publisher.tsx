"use client";

import { FileCheck2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminImageUploader, type AdminUploadedAsset } from "@/src/modules/admin/ui/admin-image-uploader";

export function DesignProofPublisher({ orderItemId, productName, currentVersion }: { orderItemId: string; productName: string; currentVersion: number }) {
  const router = useRouter();
  const [image, setImage] = useState<AdminUploadedAsset>();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function publish() {
    if (!image) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/design-proofs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderItemId, previewUrl: image.url, notes: notes.trim() || undefined }) });
      const body = await response.json() as { proof?: { version: number }; message?: string };
      if (!response.ok || !body.proof) throw new Error(body.message ?? "No pudimos publicar la prueba");
      setMessage(`Prueba v${body.proof.version} enviada al cliente.`);
      setImage(undefined);
      setNotes("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos publicar la prueba");
    } finally {
      setBusy(false);
    }
  }

  return <details className="proof-publisher"><summary><FileCheck2 size={17} /><span><strong>{productName}</strong><small>{currentVersion ? `Última prueba: v${currentVersion}` : "Sin prueba enviada"}</small></span></summary><div className="proof-publisher-body"><AdminImageUploader label="Prueba final para el cliente" hint="Sube el montaje revisado, sin guías ni controles." value={image} onUploaded={setImage} onRemove={() => setImage(undefined)} /><label>Mensaje para el cliente<textarea value={notes} maxLength={1000} rows={3} onChange={(event) => setNotes(event.target.value)} placeholder="Ej. Ajustamos la imagen al centro y conservamos los colores originales." /></label>{message && <p className={message.includes("enviada") ? "admin-success" : "inline-alert"}>{message}</p>}<button type="button" className="button button-gradient" disabled={!image || busy} onClick={() => void publish()}><Send size={16} /> {busy ? "Enviando…" : "Enviar para aprobación"}</button></div></details>;
}
