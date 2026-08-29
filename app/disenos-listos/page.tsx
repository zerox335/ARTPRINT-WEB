import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";

export const metadata: Metadata = {
  title: "Diseños listos para personalizar",
  description: "Explora productos ArtPrint con diseños anime, cumpleaños, parejas, empresas y otras colecciones listas para elegir.",
  alternates: { canonical: "/disenos-listos" },
};

function href(theme?: string) { const query = new URLSearchParams(); if (theme) query.set("theme", theme); const suffix = query.toString(); return suffix ? `/disenos-listos?${suffix}` : "/disenos-listos"; }

export default async function ReadyDesignsPage({ searchParams }: { searchParams: Promise<{ theme?: string; q?: string }> }) {
  const filters = await searchParams;
  const all = await catalogRepository.listProducts({ readyMade: true, query: filters.q });
  const themes = [...new Set(all.flatMap((product) => product.designTheme ? [product.designTheme] : []))].sort((a, b) => a.localeCompare(b, "es"));
  const products = filters.theme ? all.filter((product) => product.designTheme === filters.theme) : all;
  return <>
    <section className="ready-design-hero"><div className="container"><p className="eyebrow">Colecciones ArtPrint</p><h1>Diseños listos para elegir</h1><p>Explora productos ya diseñados. Puedes comprarlos como están o abrir el personalizador para ajustar nombre, fotografía, color y tamaño.</p></div></section>
    <section className="container ready-design-catalog"><div className="catalog-toolbar"><div className="category-pills"><Link className={!filters.theme ? "category-pill active" : "category-pill"} href={href()}>Todos</Link>{themes.map((theme) => <Link className={filters.theme === theme ? "category-pill active" : "category-pill"} href={href(theme)} key={theme}>{theme}</Link>)}</div><form className="catalog-search" action="/disenos-listos"><Search size={17} /><input name="q" defaultValue={filters.q} placeholder="Buscar anime, cumpleaños…" />{filters.theme && <input type="hidden" name="theme" value={filters.theme} />}</form></div>
      <div className="ready-design-title"><div><Sparkles size={22} /><h2>{filters.theme ?? "Todos los diseños"}</h2></div><span>{products.length} disponibles</span></div>
      {products.length ? <div className="catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state ready-design-empty"><Sparkles size={38} /><h2>Aún no hay diseños en esta colección</h2><p>El administrador puede marcar cualquier producto como Diseño listo y asignarle un tema como Anime.</p><Link className="button button-primary" href="/catalogo">Ver productos personalizables</Link></div>}
    </section>
  </>;
}
