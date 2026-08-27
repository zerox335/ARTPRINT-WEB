import Link from "next/link";

export default function NotFound() {
  return <section className="empty-state container"><span>404</span><h1>Esa pieza no está aquí</h1><p>Puede que haya cambiado de colección.</p><Link className="button button-primary" href="/catalogo">Ver catálogo</Link></section>;
}
