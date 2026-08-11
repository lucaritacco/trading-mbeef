import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas/internas: no tiene sentido que Google las rastree.
      disallow: [
        "/cuenta/",
        "/panel/",
        "/api/",
        "/login",
        "/registro",
        "/recuperar",
        "/actualizar-clave",
        "/avisos",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
