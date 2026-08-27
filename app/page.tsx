import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coffee,
  CreditCard,
  FileCheck2,
  ImagePlus,
  Layers3,
  MessageCircle,
  PackageCheck,
  Palette,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573001234567";
  const whatsappMessage = encodeURIComponent("Hola, tengo una idea y quiero ayuda para convertirla en un diseño personalizado.");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Productos personalizados en Colombia</p>
            <h1 className="display-title">Lo imaginas.<span>Nosotros lo imprimimos.</span></h1>
            <p className="lead">Crea camisetas, mugs, termos y carcasas con tus fotos, textos o ideas. Mira cómo quedará y conoce el precio antes de comprar.</p>
            <div className="hero-actions">
              <Link className="button button-gradient" href="/catalogo">Personalizar un producto <ArrowRight size={18} /></Link>
              <a className="button button-secondary" href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Pedir ayuda con mi diseño</a>
            </div>
            <div className="trust-row"><span><BadgeCheck size={17} /> Prueba digital incluida</span><span><ShieldCheck size={17} /> Pago protegido</span><span><Truck size={17} /> Envíos nacionales</span></div>
          </div>
          <div className="hero-visual" aria-label="Estudio y productos ArtPrint">
            <div className="spark spark-one">✦</div><div className="spark spark-two">AP</div>
            <div className="hero-photo"><Image src="/brand/artprint-studio.jpg" alt="Identidad de ArtPrint en el estudio" width={640} height={640} priority /></div>
            <Image className="hero-product" src="/products/textiles/camiseta-real-front.webp" alt="Camiseta personalizable ArtPrint" width={1024} height={1024} priority />
            <div className="hero-note"><strong>Así quedará</strong><span>Acomoda cada detalle antes de enviarlo a producción.</span></div>
          </div>
        </div>
      </section>

      <nav className="container home-shortcuts" aria-label="Categorías principales">
        <Link href="/catalogo?category=textiles"><span><Shirt size={22} /></span><div><strong>Camisetas</strong><small>Frente, espalda y laterales</small></div><ArrowRight size={17} /></Link>
        <Link href="/catalogo?category=mugs-termos"><span><Coffee size={22} /></span><div><strong>Mugs y termos</strong><small>Regalos que sí se usan</small></div><ArrowRight size={17} /></Link>
        <Link href="/carcasas"><span><Smartphone size={22} /></span><div><strong>Carcasas</strong><small>Busca el modelo exacto</small></div><ArrowRight size={17} /></Link>
      </nav>

      <section className="home-section container">
        <div className="section-head"><div><p className="eyebrow">Los más elegidos</p><h2 className="section-title">Empieza con uno de estos favoritos</h2></div><p>Escoge el producto que más te guste. Puedes personalizarlo tú mismo o contarnos qué necesitas.</p></div>
        <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        <div className="section-action"><Link className="button button-secondary" href="/catalogo">Ver todos los productos <ArrowRight size={17} /></Link></div>
      </section>

      <section className="container design-help-section">
        <div className="design-help-copy">
          <p className="eyebrow">También diseñamos contigo</p>
          <h2>¿Tienes la idea, pero no el diseño?</h2>
          <p>Cuéntanos para quién es, qué quieres transmitir y qué producto te gusta. Puedes dejar instrucciones al personalizar o escribirnos directamente.</p>
          <div className="design-help-actions">
            <a className="button button-primary" href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Contar mi idea</a>
            <Link className="text-link" href="/catalogo">Prefiero diseñarlo yo <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="design-help-options" aria-label="Formas de personalizar">
          <div><ImagePlus size={24} /><span><strong>Sube tu foto</strong><small>Conservamos el archivo original para producción.</small></span></div>
          <div><Palette size={24} /><span><strong>Agrega texto y color</strong><small>Organiza los elementos directamente en pantalla.</small></span></div>
          <div><Sparkles size={24} /><span><strong>Solicita apoyo</strong><small>Describe tu idea y nosotros te orientamos.</small></span></div>
        </div>
      </section>

      <section id="como-funciona" className="home-section process-section">
        <div className="container">
          <p className="eyebrow">De tu idea a tus manos</p><h2 className="section-title">Sabes qué sigue en cada momento</h2>
          <div className="process-steps">
            {[
              ["01", "Elige", "Selecciona producto, referencia, talla o color."],
              ["02", "Personaliza", "Sube tu imagen, agrega texto o describe tu idea."],
              ["03", "Revisa", "Comprueba el resultado y el precio antes de comprar."],
              ["04", "Aprueba", "Confirmamos contigo el diseño antes de producir."],
              ["05", "Recibe", "Consulta el avance y recibe tu pedido."],
            ].map(([number, title, copy]) => <div className="process-step" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="home-section container">
        <div className="section-head"><div><p className="eyebrow">Todo el catálogo</p><h2 className="section-title">¿Qué quieres personalizar hoy?</h2></div><p>Entra a una categoría y encuentra las opciones disponibles para tu idea.</p></div>
        <div className="category-grid">
          {categories.map((category) => <Link className="category-tile" href={category.slug === "carcasas" ? "/carcasas" : `/catalogo?category=${category.slug}`} key={category.id}><Image src={category.imageUrl} alt={`Productos personalizados de ${category.name}`} width={800} height={900} sizes="(max-width: 640px) 100vw, (max-width: 940px) 50vw, 33vw" /><div><h3>{category.name}</h3><p>{category.description}</p><span>Explorar <ArrowRight size={15} /></span></div></Link>)}
        </div>
      </section>

      <section className="container confidence-section">
        <div className="section-head compact-head"><div><p className="eyebrow">Compra con tranquilidad</p><h2 className="section-title">Sin adivinar cómo va a quedar</h2></div></div>
        <div className="confidence-strip">
          {[
            [Layers3, "Editor visual", "Diseña con límites reales y múltiples capas."],
            [CreditCard, "Precio transparente", "Cada ajuste aparece antes de agregar al carrito."],
            [FileCheck2, "Original protegido", "El archivo maestro nunca se reemplaza por el preview."],
            [PackageCheck, "Producción trazable", "Estados y aprobaciones quedan registrados."],
          ].map(([Icon, title, copy]) => { const C = Icon as typeof Sparkles; return <div className="confidence-item" key={String(title)}><C size={24} /><h3>{String(title)}</h3><p>{String(copy)}</p></div>; })}
        </div>
      </section>

      <section className="container faq-section">
        <div className="faq-heading"><p className="eyebrow">Preguntas frecuentes</p><h2 className="section-title">Antes de empezar</h2><p>Lo esencial para hacer tu pedido con seguridad.</p></div>
        <div className="faq-list">
          <details><summary>¿Puedo usar mi propia foto o diseño?</summary><p>Sí. Puedes subir archivos PNG, JPG, WEBP o SVG seguro desde el personalizador. Guardamos el original por separado para producción.</p></details>
          <details><summary>¿Puedo ver cómo quedará antes de pagar?</summary><p>Sí. El editor muestra la ubicación y proporción del diseño, y el precio se actualiza antes de agregar el producto al carrito.</p></details>
          <details><summary>¿Qué pasa si todavía no tengo el diseño?</summary><p>Puedes escribir instrucciones al personalizar el producto o contarnos tu idea por WhatsApp para recibir orientación.</p></details>
          <details><summary>¿Realizan envíos en Colombia?</summary><p>Sí. La información de entrega y el valor correspondiente se muestran antes de finalizar la compra.</p></details>
        </div>
      </section>
    </>
  );
}
