import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><BrandMark /><p>Convertimos ideas en objetos que se sienten tuyos.</p></div>
        <div><h2>Comprar</h2><Link href="/catalogo">Catálogo</Link><Link href="/catalogo?category=textiles">Textiles</Link><Link href="/catalogo?category=mugs-termos">Mugs y vasos</Link><Link href="/carcasas">Carcasas</Link></div>
        <div><h2>Ayuda</h2><Link href="/mi-cuenta">Estado de pedido</Link><Link href="/#como-funciona">Cómo personalizar</Link><a href="mailto:hola@artprint.local">hola@artprint.local</a></div>
        <div><h2>Confianza</h2><span>Pago validado por pasarela</span><span>Archivos originales protegidos</span><span>Aprobación antes de producir</span></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} ArtPrint</span><span>Hecho con intención en Colombia</span></div>
    </footer>
  );
}
