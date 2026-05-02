import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getMetadataBase().toString().replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/checkout", "/hesap", "/hesap/*", "/orders/*"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
