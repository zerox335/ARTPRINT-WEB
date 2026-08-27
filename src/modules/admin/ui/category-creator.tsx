"use client";

import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminImageUploader, type AdminUploadedAsset } from "@/src/modules/admin/ui/admin-image-uploader";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState<AdminUploadedAsset>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, description: String(form.get("description")), imageAssetId: image?.id }) });
      const body = await response.json() as { category?: { name: string }; message?: string };
      if (!response.ok || !body.category) throw new Error(body.message ?? "No pudimos crear la categoría");
      setMessage(`Categoría “${body.category.name}” creada. Ya puedes seleccionarla abajo.`);
      setName("");
      setSlug("");
      setImage(undefined);
      formElement.reset();
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos crear la categoría"); } finally { setBusy(false); }
  }

  return <details className="admin-category-creator"><summary><FolderPlus size={18} /><span><strong>¿Vas a vender un tipo de producto nuevo?</strong><small>Crea primero su categoría sin modificar código.</small></span></summary><form onSubmit={submit}><div className="form-grid"><label>Nombre<input required minLength={2} value={name} onChange={(event) => { setName(event.target.value); setSlug(slugify(event.target.value)); }} placeholder="Regalos corporativos" /></label><label>Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} /></label><label className="full-field">Descripción<input name="description" required minLength={10} maxLength={300} /></label></div><AdminImageUploader label="Portada de categoría (opcional)" hint="Se mostrará en la página principal." value={image} onUploaded={setImage} onRemove={() => setImage(undefined)} />{message && <p className={message.includes("creada") ? "admin-success" : "inline-alert"}>{message}</p>}<button className="button button-secondary" disabled={busy}><FolderPlus size={16} /> {busy ? "Creando…" : "Crear categoría"}</button></form></details>;
}
