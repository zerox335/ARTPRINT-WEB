"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { useCart } from "@/src/modules/cart/ui/cart-provider";

export function SiteHeader() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="announcement">Envíos a toda Colombia · Prueba digital antes de producir</div>
      <div className="header-inner container">
        <BrandMark />
        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
          <Link href="/catalogo" onClick={() => setOpen(false)}>Productos</Link>
          <Link href="/disenos-listos" onClick={() => setOpen(false)}>Diseños listos</Link>
          <Link href="/catalogo?category=textiles" onClick={() => setOpen(false)}>Textiles</Link>
          <Link href="/catalogo?category=mugs-termos" onClick={() => setOpen(false)}>Mugs</Link>
          <Link href="/carcasas" onClick={() => setOpen(false)}>Carcasas</Link>
          <Link href="/#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</Link>
        </nav>
        <div className="header-actions">
          <Link href="/catalogo" className="icon-button desktop-only" aria-label="Buscar"><Search size={20} /></Link>
          <Link href="/ingresar" className="icon-button" aria-label="Mi cuenta"><UserRound size={20} /></Link>
          <Link href="/carrito" className="icon-button cart-button" aria-label={`Carrito, ${itemCount} productos`}>
            <ShoppingBag size={21} />{itemCount > 0 && <span>{itemCount}</span>}
          </Link>
          <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Abrir menú">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
