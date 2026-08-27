import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, CircleDollarSign, Clock3, FileCheck2, PackageCheck, Plus, ShoppingBag, Truck, UsersRound } from "lucide-react";
import { prisma } from "@/src/infrastructure/database/prisma";
import { currentUser } from "@/src/modules/identity/infrastructure/session";
import { OrderStatusControl } from "@/src/modules/admin/ui/order-status-control";
import { formatMoney } from "@/src/shared/money";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const user = await currentUser(); if (!user) redirect("/ingresar?next=/admin"); if (!["ADMIN", "DESIGNER", "PRODUCTION", "CUSTOMER_SUPPORT"].includes(user.role)) redirect("/mi-cuenta");
  const today = new Date(); today.setHours(0,0,0,0); const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const [todaySales, monthSales, counts, orders, customerCount] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } }, _sum: { grandTotal: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: month }, status: { not: "CANCELLED" } }, _sum: { grandTotal: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true, email: true } } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);
  const count = Object.fromEntries(counts.map((item) => [item.status, item._count._all]));
  const cards = [[CircleDollarSign,"Ventas hoy",formatMoney(todaySales._sum.grandTotal ?? 0)], [ShoppingBag,"Ventas del mes",formatMoney(monthSales._sum.grandTotal ?? 0)], [Clock3,"Revisión de diseño",String(count.DESIGN_REVIEW ?? 0)], [FileCheck2,"Esperando aprobación",String(count.WAITING_CUSTOMER_APPROVAL ?? 0)], [Boxes,"En producción",String(count.IN_PRODUCTION ?? 0)], [PackageCheck,"Listos",String(count.READY ?? 0)], [Truck,"Enviados",String(count.SHIPPED ?? 0)], [UsersRound,"Clientes",String(customerCount)]] as const;
  return <section className="container admin-page"><div className="admin-top"><div><p className="eyebrow">Operación ArtPrint</p><h1>Hola, {user.name.split(" ")[0]}</h1><p>Una vista clara de lo que necesita atención hoy.</p></div><Link className="button button-gradient" href="/admin/productos"><Plus size={17} /> Nuevo producto</Link></div><div className="admin-nav"><Link className="active" href="/admin">Resumen</Link><a href="#pedidos">Pedidos</a><Link href="/admin/productos">Productos</Link><span>Diseños</span><span>Pagos</span><span>Inventario</span><span>Reportes</span></div><div className="metric-grid">{cards.map(([Icon,label,value]) => { const C = Icon; return <div className="metric-card" key={label}><C size={20} /><span>{label}</span><strong>{value}</strong></div>; })}</div><div className="admin-table-card" id="pedidos"><div className="admin-table-head"><div><h2>Pedidos recientes</h2><p>Estado comercial y de producción</p></div><span>{orders.length} visibles</span></div><div className="admin-table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.number}</strong></td><td>{order.user?.name ?? "Cliente"}<small>{order.user?.email}</small></td><td>{formatMoney(order.grandTotal)}</td><td><span className={`status-chip status-${order.status.toLocaleLowerCase()}`}>{order.status.replaceAll("_", " ")}</span></td><td>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(order.createdAt)}</td><td><OrderStatusControl orderId={order.id} status={order.status} /></td></tr>)}</tbody></table></div></div></section>;
}
