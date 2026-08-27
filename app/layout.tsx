import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { CartProvider } from "@/src/modules/cart/ui/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "ArtPrint",
  title: { default: "ArtPrint | Camisetas, mugs y carcasas personalizadas", template: "%s | ArtPrint" },
  description: "Personaliza camisetas, mugs, termos y carcasas en Colombia. Diseña en línea, conoce el precio y aprueba tu diseño antes de producir.",
  alternates: { canonical: "/" },
  category: "ecommerce",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "ArtPrint | Productos personalizados en Colombia",
    description: "Crea camisetas, mugs, termos y carcasas con tu propio diseño.",
    url: "/",
    siteName: "ArtPrint",
    images: [{ url: "/brand/artprint-studio.jpg", width: 640, height: 640, alt: "ArtPrint, productos personalizados en Colombia" }],
    locale: "es_CO",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "ArtPrint | Productos personalizados", description: "Tu idea, hecha objeto.", images: ["/brand/artprint-studio.jpg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <CartProvider><SiteHeader /><main>{children}</main><SiteFooter /><WhatsAppLink /></CartProvider>
      </body>
    </html>
  );
}
