import type { Metadata } from "next";
import { CartPage } from "@/src/modules/cart/ui/cart-page";

export const metadata: Metadata = { title: "Carrito", robots: { index: false, follow: false } };
export default function Page() { return <CartPage />; }
