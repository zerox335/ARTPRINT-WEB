import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";

export const metadata: Metadata = {
  title: "Catálogo de productos personalizados",
  description: "Compra camisetas, mugs, termos y carcasas personalizadas. Sube tu imagen, revisa el resultado y conoce el precio antes de comprar.",
  alternates: { canonical: "/catalogo" },
};

const PAGE_SIZE = 24;

function catalogHref(filters: { category?: string; q?: string }, page: number) {
  const query = new URLSearchParams();
  if (filters.category) query.set("category", filters.category);
  if (filters.q) query.set("q", filters.q);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return suffix ? `/catalogo?${suffix}` : "/catalogo";
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; page?: string }> }) {
  const filters = await searchParams;
  const [products, categories] = await Promise.all([catalogRepository.listProducts(filters), catalogRepository.listCategories()]);
  const requestedPage = Number.parseInt(filters.page ?? "", 10);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
  const visibleProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  return (
    <>
      <section className="page-hero container"><div className="page-hero-grid"><div><p className="eyebrow">Catálogo</p><h1>Elige tu próximo lienzo</h1></div><p>Todos los productos están preparados para personalización, cotización dinámica y aprobación de diseño.</p></div></section>
      <section className="container">
        <div className="catalog-toolbar">
          <div className="category-pills"><Link className={!filters.category ? "category-pill active" : "category-pill"} href="/catalogo">Todos</Link>{categories.map((category) => <Link className={filters.category === category.slug ? "category-pill active" : "category-pill"} href={category.slug === "carcasas" ? "/carcasas" : `/catalogo?category=${category.slug}`} key={category.id}>{category.name}</Link>)}</div>
          <form className="catalog-search" action="/catalogo"><Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="catalog-search">Buscar productos</label><input id="catalog-search" name="q" defaultValue={filters.q} placeholder="Buscar producto…" />{filters.category && <input type="hidden" name="category" value={filters.category} />}</form>
        </div>
        <p className="catalog-count">{products.length} {products.length === 1 ? "producto" : "productos"}</p>
        {visibleProducts.length ? <><div className="catalog-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>{pageCount > 1 && <nav className="catalog-pagination" aria-label="Páginas del catálogo">{currentPage === 1 ? <span className="disabled">Anterior</span> : <Link href={catalogHref(filters, currentPage - 1)} prefetch={false}>Anterior</Link>}{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Link aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "active" : ""} href={catalogHref(filters, page)} key={page} prefetch={false}>{page}</Link>)}{currentPage === pageCount ? <span className="disabled">Siguiente</span> : <Link href={catalogHref(filters, currentPage + 1)} prefetch={false}>Siguiente</Link>}</nav>}</> : <div className="empty-state"><span>SIN RESULTADOS</span><h2>No encontramos esa idea</h2><p>Prueba otra búsqueda o explora todas las categorías.</p><Link className="button button-primary" href="/catalogo">Limpiar filtros</Link></div>}
      </section>
    </>
  );
}
