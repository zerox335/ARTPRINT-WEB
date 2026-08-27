import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/src/infrastructure/database/prisma";
import { CaseReferenceActivator } from "@/src/modules/admin/ui/case-reference-activator";
import { currentUser } from "@/src/modules/identity/infrastructure/session";

export const metadata: Metadata = { title: "Configurar referencia · Administración", robots: { index: false, follow: false } };

export default async function ConfigureProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/admin/productos");
  if (user.role !== "ADMIN") redirect("/admin");
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product || product.category.slug !== "carcasas") notFound();
  const metadata = product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata) ? product.metadata as Record<string, unknown> : {};
  if (product.status !== "DRAFT" || metadata.mockupStatus !== "REFERENCE_ONLY") redirect("/admin/productos");
  return <section className="container admin-page"><Link className="back-link" href="/admin/productos"><ArrowLeft size={16} /> Volver a productos</Link><div className="admin-top"><div><p className="eyebrow">Activar referencia</p><h1>{product.name}</h1><p>{[metadata.brand, metadata.series, metadata.deviceModel].filter((item): item is string => typeof item === "string").join(" · ")}. Carga su plantilla exacta antes de mostrarla al cliente.</p></div></div><CaseReferenceActivator product={{ id: product.id, name: product.name, slug: product.slug, brand: typeof metadata.brand === "string" ? metadata.brand : undefined, series: typeof metadata.series === "string" ? metadata.series : undefined, deviceModel: typeof metadata.deviceModel === "string" ? metadata.deviceModel : undefined }} /></section>;
}
