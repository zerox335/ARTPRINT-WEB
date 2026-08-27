import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: ["/", "/catalogo", "/productos/"], disallow: ["/admin/", "/api/", "/checkout/", "/mi-cuenta/"] }], sitemap: `${base}/sitemap.xml` };
}
