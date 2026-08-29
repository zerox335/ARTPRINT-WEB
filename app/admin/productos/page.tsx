import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes, ExternalLink, Pencil } from "lucide-react";
import { prisma } from "@/src/infrastructure/database/prisma";
import { CatalogProductBuilder } from "@/src/modules/admin/ui/catalog-product-builder";
import { CategoryCreator } from "@/src/modules/admin/ui/category-creator";
import { currentUser } from "@/src/modules/identity/infrastructure/session";
import { formatMoney } from "@/src/shared/money";

export const metadata: Metadata = { title: "Productos · Administración", robots: { index: false, follow: false } };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/admin/productos");
  if (user.role !== "ADMIN") redirect("/admin");
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim().slice(0, 100) ?? "";
  const [products, categories, totalProducts] = await Promise.all([
    prisma.product.findMany({ where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }, { variants: { some: { sku: { contains: query, mode: "insensitive" } } } }] } : undefined, orderBy: [{ status: "asc" }, { name: "asc" }], take: 120, include: { category: true, _count: { select: { variants: true, images: true, mockups: true } } } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" }, select: { id: true, name: true } }),
    prisma.product.count(),
  ]);

  return (
    <section className="container admin-page">
      <Link className="back-link" href="/admin"><ArrowLeft size={16} /> Volver al dashboard</Link>
      <div className="admin-top"><div><p className="eyebrow">Gestor de catálogo</p><h1>Productos y mockups</h1><p>Sube referencias, crea variantes y configura visualmente dónde podrá diseñar el cliente.</p></div></div>
      <div className="admin-table-card">
        <div className="admin-table-head"><div><h2>Catálogo actual</h2><p>{query ? `${products.length} resultados para “${query}”` : `${totalProducts} productos · mostrando los primeros ${products.length}`}</p></div><Boxes size={22} /></div>
        <form className="admin-catalog-search" action="/admin/productos"><label htmlFor="admin-product-search">Buscar modelo, referencia o SKU</label><div><input id="admin-product-search" name="q" defaultValue={query} placeholder="Ej. Samsung A55, iPhone 13…" /><button className="button button-secondary">Buscar</button>{query && <Link href="/admin/productos">Limpiar</Link>}</div></form>
        <div className="admin-table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Contenido</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{products.map((product) => { const metadata = product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata) ? product.metadata as Record<string, unknown> : {}; const isCaseReference = product.status === "DRAFT" && metadata.mockupStatus === "REFERENCE_ONLY"; return <tr key={product.id}><td><strong>{product.name}</strong><small>{product.slug}</small></td><td>{product.category.name}</td><td>{formatMoney(product.basePrice)}</td><td>{product._count.variants} var. · {product._count.images} fotos · {product._count.mockups} mockups</td><td><span className={`status-chip status-${product.status.toLocaleLowerCase()}`}>{isCaseReference ? "SIN VISTAS" : product.status}</span></td><td><div className="admin-table-actions"><Link className="admin-table-link" href={`/admin/productos/${product.id}`}><Pencil size={13} /> Editar todo</Link>{product.status === "ACTIVE" && <Link className="admin-table-link" href={`/productos/${product.slug}`} target="_blank">Ver <ExternalLink size={13} /></Link>}</div></td></tr>; })}</tbody></table></div>
      </div>
      <div className="admin-builder-shell"><CategoryCreator /><CatalogProductBuilder categories={categories} /></div>
    </section>
  );
}
