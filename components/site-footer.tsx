import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { env } from "@/src/shared/env";

export function SiteFooter() {
  const whatsapp = `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, necesito ayuda con ArtPrint.")}`;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><BrandMark /><p>Convertimos ideas en objetos que se sienten tuyos.</p></div>
        <div><h2>Comprar</h2><Link href="/catalogo">Catálogo</Link><Link href="/catalogo?category=textiles">Textiles</Link><Link href="/catalogo?category=mugs-termos">Mugs y vasos</Link><Link href="/carcasas">Carcasas</Link></div>
        <div><h2>Ayuda</h2><Link href="/mi-cuenta">Estado de pedido</Link><Link href="/ayuda#personalizar">Cómo personalizar</Link><Link href="/ayuda#envios">Envíos y recogida</Link><a href={whatsapp} target="_blank" rel="noreferrer">Hablar por WhatsApp</a></div>
        <div><h2>Confianza</h2><Link href="/ayuda#cambios">Cambios y garantías</Link><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos de compra</Link><span>Aprobación antes de producir</span></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} ArtPrint</span><span>Hecho con intención en Colombia</span></div>
    </footer>
  );
}
