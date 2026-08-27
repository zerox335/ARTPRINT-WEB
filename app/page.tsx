import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, FileCheck2, Layers3, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";

export default async function HomePage() {
  const [products, categories] = await Promise.all([catalogRepository.listProducts(), catalogRepository.listCategories()]);
  const featured = products.filter((product) => product.featured).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/#organization`, name: "ArtPrint", url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/brand/artprint-studio.jpg` },
      { "@type": "WebSite", "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/#website`, name: "ArtPrint", url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", inLanguage: "es-CO", publisher: { "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/#organization` } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Personalización sin sorpresas</p>
            <h1 className="display-title">Tu idea.<span>Hecha objeto.</span></h1>
            <p className="lead">Diseña en pantalla, conoce el precio al instante y aprueba el resultado antes de que entre a producción.</p>
            <div className="hero-actions">
              <Link className="button button-gradient" href="/catalogo">Empezar a crear <ArrowRight size={18} /></Link>
              <Link className="button button-secondary" href="#como-funciona">Ver cómo funciona</Link>
            </div>
            <div className="trust-row"><span><BadgeCheck size={17} /> Prueba digital incluida</span><span><ShieldCheck size={17} /> Pago protegido</span><span><Truck size={17} /> Envíos nacionales</span></div>
          </div>
          <div className="hero-visual" aria-label="Estudio y productos ArtPrint">
            <div className="spark spark-one">✦</div><div className="spark spark-two">AP</div>
            <div className="hero-photo"><Image src="/brand/artprint-studio.jpg" alt="Identidad de ArtPrint en el estudio" width={640} height={640} priority /></div>
            <Image className="hero-product" src="/products/textiles/camiseta-real-front.webp" alt="Camiseta personalizable ArtPrint" width={1024} height={1024} priority />
            <div className="hero-note"><strong>100% tuyo</strong><span>Mueve, escala y combina hasta que se sienta bien.</span></div>
          </div>
        </div>
      </section>

      <section className="home-section container">
        <div className="section-head"><div><p className="eyebrow">Favoritos</p><h2 className="section-title">Un lienzo para cada idea</h2></div><p>Elige un producto, ajústalo a tu estilo y deja que nosotros nos ocupemos de materializarlo.</p></div>
        <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        <div style={{ textAlign: "center", marginTop: 35 }}><Link className="button button-secondary" href="/catalogo">Explorar todo el catálogo <ArrowRight size={17} /></Link></div>
      </section>

      <section id="como-funciona" className="home-section process-section">
        <div className="container">
          <p className="eyebrow">De la pantalla a tus manos</p><h2 className="section-title">Un proceso claro, de principio a fin</h2>
          <div className="process-steps">
            {[
              ["01", "Personaliza", "Sube tu imagen, agrega texto y organiza cada elemento."],
              ["02", "Previsualiza", "Comprueba proporciones dentro del área real de impresión."],
              ["03", "Cotiza", "El precio cambia con variante, técnica, zonas y cantidad."],
              ["04", "Aprueba", "Revisa la prueba final y confirma antes de producir."],
              ["05", "Recibe", "Sigue producción y entrega desde tu cuenta."],
            ].map(([number, title, copy]) => <div className="process-step" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="home-section container">
        <div className="section-head"><div><p className="eyebrow">Encuentra tu formato</p><h2 className="section-title">¿Qué quieres hacer único?</h2></div></div>
        <div className="category-grid">
          {categories.map((category) => <Link className="category-tile" href={category.slug === "carcasas" ? "/carcasas" : `/catalogo?category=${category.slug}`} key={category.id}><Image src={category.imageUrl} alt="" width={800} height={900} /><div><h3>{category.name}</h3><p>{category.description}</p></div></Link>)}
        </div>
      </section>

      <section className="container">
        <div className="confidence-strip">
          {[
            [Layers3, "Editor visual", "Diseña con límites reales y múltiples capas."],
            [CreditCard, "Precio transparente", "Cada ajuste aparece antes de agregar al carrito."],
            [FileCheck2, "Original protegido", "El archivo maestro nunca se reemplaza por el preview."],
            [PackageCheck, "Producción trazable", "Estados y aprobaciones quedan registrados."],
          ].map(([Icon, title, copy]) => { const C = Icon as typeof Sparkles; return <div className="confidence-item" key={String(title)}><C size={24} /><h3>{String(title)}</h3><p>{String(copy)}</p></div>; })}
        </div>
      </section>
    </>
  );
}
