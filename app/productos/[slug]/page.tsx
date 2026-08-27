import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/product-configurator";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";
import { formatMoney } from "@/src/shared/money";

export async function generateStaticParams() {
  return (await catalogRepository.listProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await catalogRepository.findBySlug((await params).slug);
  return product ? {
    title: `${product.name} personalizado`,
    description: product.shortDescription,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: { title: `${product.name} personalizado | ArtPrint`, description: product.shortDescription, url: `/productos/${product.slug}`, images: [{ url: product.imageUrl, alt: product.name }], type: "website" },
    twitter: { card: "summary_large_image", title: `${product.name} personalizado`, description: product.shortDescription, images: [product.imageUrl] },
  } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await catalogRepository.findBySlug((await params).slug);
  if (!product) notFound();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const productJsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.gallery.map((image) => new URL(image, base).toString()), description: product.description, sku: product.variants[0]?.sku, brand: { "@type": "Brand", name: "ArtPrint" }, offers: { "@type": "Offer", url: `${base}/productos/${product.slug}`, priceCurrency: "COP", price: product.basePrice, availability: product.variants.some((variant) => variant.available) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" } };
  return (
    <section className="container product-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replaceAll("<", "\\u003c") }} />
      <div className="product-gallery"><div className="product-main-image"><Image src={product.imageUrl} alt={product.name} width={800} height={900} priority /></div>{product.gallery.length > 1 && <div className="product-thumbs">{product.gallery.map((image, index) => <Image key={image} src={image} alt={`${product.name}, vista ${index + 1}`} width={800} height={900} />)}</div>}</div>
      <div className="product-info"><div className="breadcrumbs"><Link href="/">Inicio</Link><span>/</span><Link href="/catalogo">Catálogo</Link><span>/</span><span>{product.name}</span></div><p className="eyebrow">{product.categoryName}</p><h1>{product.name}</h1><p className="product-price">Desde <strong>{formatMoney(product.basePrice)}</strong></p><p className="product-description">{product.description}</p><ProductConfigurator product={product} /><div className="option-group"><div className="option-label"><span>Detalles</span></div><div className="option-cards">{product.highlights.map((highlight) => <span className="option-card" key={highlight}>{highlight}</span>)}</div></div></div>
    </section>
  );
}
