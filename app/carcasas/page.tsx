import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2, Clock3, Search, ShieldCheck, Smartphone } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";
import { phoneCaseCatalogReferences, phoneCaseReferenceKey, type PhoneCaseReference } from "@/src/modules/catalog/infrastructure/demo-cases";

export const metadata: Metadata = {
  title: "Carcasas personalizadas por modelo",
  description: "Consulta la compatibilidad de tu celular y personaliza únicamente sobre mockups calibrados para cada referencia.",
  alternates: { canonical: "/carcasas" },
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const PAGE_SIZE = 36;

function CaseReferenceCard({ reference }: { reference: PhoneCaseReference }) {
  return (
    <article className="case-reference-card">
      <div className="case-reference-placeholder" aria-hidden="true">
        <Smartphone size={52} strokeWidth={1.4} />
        <span>{reference.brand}</span>
      </div>
      <div className="case-reference-content">
        <p className="case-reference-kicker"><CheckCircle2 size={15} /> Compatibilidad registrada</p>
        <h3>Carcasa {reference.model}</h3>
        <p>{reference.brand} · {reference.series}</p>
        <span className="case-reference-status"><Clock3 size={15} /> Mockup exacto pendiente</span>
        <small>Se habilitará la personalización cuando el recorte de cámara esté calibrado.</small>
      </div>
    </article>
  );
}

function pageHref(filters: { brand: string; series: string; query: string }, page: number) {
  const query = new URLSearchParams();
  if (filters.brand) query.set("brand", filters.brand);
  if (filters.series) query.set("series", filters.series);
  if (filters.query) query.set("q", filters.query);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return suffix ? `/carcasas?${suffix}` : "/carcasas";
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ brand?: string | string[]; series?: string | string[]; q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const selectedBrand = first(params.brand);
  const selectedSeries = first(params.series);
  const query = first(params.q).trim().toLocaleLowerCase("es");
  const calibratedCases = await catalogRepository.listProducts({ category: "carcasas" });
  const calibratedByReference = new Map(calibratedCases.flatMap((product) => product.brand && product.deviceModel ? [[phoneCaseReferenceKey(product.brand, product.deviceModel), product] as const] : []));
  const brands = [...new Set(phoneCaseCatalogReferences.map((reference) => reference.brand))].sort((a, b) => a.localeCompare(b, "es"));
  const series = [...new Set(phoneCaseCatalogReferences.filter((reference) => !selectedBrand || reference.brand === selectedBrand).map((reference) => reference.series))].sort((a, b) => a.localeCompare(b, "es"));
  const matchingReferences = phoneCaseCatalogReferences.filter((reference) => {
    const matchesBrand = !selectedBrand || reference.brand === selectedBrand;
    const matchesSeries = !selectedSeries || reference.series === selectedSeries;
    const searchable = `${reference.brand} ${reference.series} ${reference.model}`.toLocaleLowerCase("es");
    return matchesBrand && matchesSeries && (!query || searchable.includes(query));
  });
  const matchingCalibratedCount = matchingReferences.filter((reference) => calibratedByReference.has(phoneCaseReferenceKey(reference.brand, reference.model))).length;
  const requestedPage = Number.parseInt(first(params.page), 10);
  const pageCount = Math.max(1, Math.ceil(matchingReferences.length / PAGE_SIZE));
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
  const references = matchingReferences.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeFilters = { brand: selectedBrand, series: selectedSeries, query: first(params.q) };

  return (
    <>
      <section className="case-hero">
        <div className="container case-hero-grid">
          <div className="case-hero-copy">
            <p className="eyebrow">Carcasas por referencia</p>
            <h1>Tu diseño, sobre el molde correcto.</h1>
            <p>Elige marca, serie y modelo. Solo mostramos el botón de personalizar cuando el mockup y el recorte de cámara corresponden realmente a esa referencia.</p>
            <div className="case-hero-points">
              <span><Smartphone size={18} /> Referencia específica</span>
              <span><Camera size={18} /> Cámara validada</span>
              <span><ShieldCheck size={18} /> Prueba antes de producir</span>
            </div>
          </div>
          <div className="case-hero-art" aria-hidden="true">
            <div className="case-color-card"><span>Vista real</span><strong>Personaliza y previsualiza</strong></div>
            <Image src="/products/mockups/cases/iphone-15.webp" alt="" width={1182} height={1330} priority />
          </div>
        </div>
      </section>

      <section className="container case-shop">
        <div className="case-finder-card">
          <div className="case-finder-heading">
            <span><Search size={19} /></span>
            <div><h2>Encuentra tu celular</h2><p>Confirma la referencia exacta antes de personalizar.</p></div>
          </div>
          <form className="case-finder" action="/carcasas">
            <label>Marca<select name="brand" defaultValue={selectedBrand}><option value="">Todas las marcas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
            <label>Serie<select name="series" defaultValue={selectedSeries}><option value="">Todas las series</option>{series.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Modelo<input name="q" defaultValue={first(params.q)} placeholder="Ej. A16, iPhone 15…" /></label>
            <button className="button button-gradient" type="submit">Buscar referencia</button>
          </form>
        </div>

        <nav className="case-brand-nav" aria-label="Filtrar carcasas por marca">
          <Link className={!selectedBrand ? "active" : ""} href="/carcasas">Todas</Link>
          {brands.map((brand) => <Link className={brand === selectedBrand ? "active" : ""} href={`/carcasas?brand=${encodeURIComponent(brand)}`} key={brand}>{brand}</Link>)}
        </nav>

        <div className="case-results-heading">
          <div><p className="eyebrow">Directorio de compatibilidad</p><h2>{selectedBrand || selectedSeries || query ? "Resultados para tu búsqueda" : "Elige tu modelo"}</h2><p className="case-results-note">Los productos con fotografía están listos para personalizar. Las tarjetas sin foto aún esperan su mockup exacto.</p></div>
          <span>{matchingReferences.length} {matchingReferences.length === 1 ? "referencia" : "referencias"} · {matchingCalibratedCount} {matchingCalibratedCount === 1 ? "lista" : "listas"}</span>
        </div>
        {references.length ? <><div className="catalog-grid">{references.map((reference) => { const product = calibratedByReference.get(phoneCaseReferenceKey(reference.brand, reference.model)); return product ? <ProductCard key={reference.slug} product={product} /> : <CaseReferenceCard key={reference.slug} reference={reference} />; })}</div>{pageCount > 1 && <nav className="catalog-pagination" aria-label="Páginas de referencias">{currentPage === 1 ? <span className="disabled">Anterior</span> : <Link href={pageHref(activeFilters, currentPage - 1)} prefetch={false}>Anterior</Link>}{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Link aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "active" : ""} href={pageHref(activeFilters, page)} key={page} prefetch={false}>{page}</Link>)}{currentPage === pageCount ? <span className="disabled">Siguiente</span> : <Link href={pageHref(activeFilters, currentPage + 1)} prefetch={false}>Siguiente</Link>}</nav>}</> : <div className="empty-state case-empty"><Smartphone size={38} /><h2>Aún no tenemos esa referencia</h2><p>Revisa el nombre del modelo o consulta disponibilidad por WhatsApp.</p><Link className="button button-primary" href="/carcasas">Ver todas las carcasas</Link></div>}
      </section>
    </>
  );
}
