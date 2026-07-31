import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://decarnesonline.com";

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
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
