import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductView } from "@/src/modules/catalog/domain/catalog";
import { formatMoney } from "@/src/shared/money";

export function ProductCard({ product }: { product: ProductView }) {
  return (
    <article className="product-card">
      <Link href={`/productos/${product.slug}`} className="product-image-wrap">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <Image src={product.imageUrl} alt={product.name} width={800} height={900} className="product-image" />
        <span className="product-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
      </Link>
      <div className="product-card-body">
        <span>{product.readyMade && product.designTheme ? product.designTheme : product.categoryName}</span>
        <Link href={`/productos/${product.slug}`}><h3>{product.name}</h3></Link>
        <div><strong>Desde {formatMoney(product.basePrice)}</strong><small>{product.readyMade ? "Diseño listo" : "Personalizable"}</small></div>
      </div>
    </article>
  );
}
