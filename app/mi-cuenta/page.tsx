import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, CircleHelp, Clock3, PackageSearch, Palette } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/src/infrastructure/database/prisma";
import { currentUser } from "@/src/modules/identity/infrastructure/session";
import { formatMoney } from "@/src/shared/money";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } };
const statusLabel: Record<string, string> = { PENDING_PAYMENT: "Pendiente de pago", PAID: "Pago confirmado", DESIGN_REVIEW: "En revisión de diseño", WAITING_CUSTOMER_APPROVAL: "Esperando tu aprobación", APPROVED: "Diseño aprobado", IN_PRODUCTION: "En producción", QUALITY_CONTROL: "Control de calidad", READY: "Listo", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };

export default async function AccountPage() {
  const user = await currentUser(); if (!user) redirect("/ingresar?next=/mi-cuenta");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: { take: 1 } } });
  return <section className="container account-page"><aside className="account-sidebar"><div className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</div><h1>{user.name}</h1><p>{user.email}</p><nav><a className="active" href="#pedidos"><PackageSearch size={17} /> Pedidos</a><a href="#pedidos"><Palette size={17} /> Diseños y aprobaciones</a><Link href="/ayuda"><CircleHelp size={17} /> Ayuda</Link></nav>{["ADMIN", "DESIGNER", "PRODUCTION", "CUSTOMER_SUPPORT"].includes(user.role) && <Link className="button button-secondary button-block" href="/admin">Ir a administración</Link>}<LogoutButton /></aside><div className="account-content"><div className="account-title"><div><p className="eyebrow">Mi espacio</p><h2 id="pedidos">Pedidos recientes</h2></div><span>{orders.length} en total</span></div>{orders.length ? <div className="account-orders">{orders.map((order) => { const product = order.items[0]?.productSnapshot as { name?: string } | null; return <Link href={`/checkout/resultado?order=${order.number}`} className="account-order" key={order.id}><div className="order-status-dot" /><div><span>{order.number}</span><h3>{product?.name ?? "Pedido personalizado"}{order.items.length > 1 ? ` + ${order.items.length - 1}` : ""}</h3><p><Clock3 size={13} /> {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(order.createdAt)}</p></div><div><span className={`status-chip status-${order.status.toLocaleLowerCase()}`}>{statusLabel[order.status]}</span><strong>{formatMoney(order.grandTotal)}</strong></div><ChevronRight size={18} /></Link>; })}</div> : <div className="account-empty"><PackageSearch size={34} /><h3>Aún no tienes pedidos</h3><p>Cuando conviertas una idea en producto, podrás seguirla aquí.</p><Link className="button button-gradient" href="/catalogo">Empezar a crear</Link></div>}</div></section>;
}
