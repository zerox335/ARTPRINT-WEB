import type { Metadata } from "next";
import { Suspense } from "react";
import { SandboxCheckout } from "@/src/modules/payments/ui/sandbox-checkout";
export const metadata: Metadata = { title: "Pago sandbox", robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<div className="page-loader"><span /></div>}><SandboxCheckout /></Suspense>; }
