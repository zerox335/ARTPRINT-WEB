import type { Metadata } from "next";
import { CheckoutForm } from "@/src/modules/checkout/ui/checkout-form";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function Page() { return <CheckoutForm />; }
