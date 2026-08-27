import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderResult } from "@/src/modules/orders/ui/order-result";
export const metadata: Metadata = { title: "Estado del pago", robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<div className="page-loader"><span /></div>}><OrderResult /></Suspense>; }
