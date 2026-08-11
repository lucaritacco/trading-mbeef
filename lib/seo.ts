// Fuente única de verdad para la URL canónica del sitio y los datos estructurados.
//
// IMPORTANTE: el dominio debe coincidir EXACTAMENTE con el que sirve el host.
// Hoy decarnesonline.com redirige 301 a www.decarnesonline.com, así que el
// canónico es la versión con www. Si algún día se invierte el redirect, hay que
// cambiar NEXT_PUBLIC_SITE_URL en Vercel (y este default) para que sigan
// coincidiendo: sitemap, robots, canonicals y OG salen todos de acá.

import { site } from "./site";

const FALLBACK = "https://www.decarnesonline.com";

function normalizar(url: string) {
  return url.trim().replace(/\/+$/, "");
}

export const SITE_URL = normalizar(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK);

/** URL absoluta y canónica para una ruta interna. */
export function absoluta(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Organization + datos de contacto de MBEEF.
 * Le dice a Google quién está detrás del sitio y lo vincula con la web
 * institucional, que es lo que alimenta el panel de conocimiento.
 */
export function jsonLdOrganizacion() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organizacion`,
    name: "DeCarnes",
    alternateName: "DeCarnes by MBEEF",
    url: SITE_URL,
    logo: absoluta("/icon-512.png"),
    image: absoluta("/images/hero.jpg"),
    description:
      "Catálogo de lotes de carne vacuna de frigoríficos seleccionados por MBEEF, operador mayorista del mercado argentino desde 1994.",
    foundingDate: "1994",
    parentOrganization: {
      "@type": "Organization",
      name: "MBEEF",
      url: site.mbeefUrl,
    },
    sameAs: [site.mbeefUrl],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Thompson 1226",
      addressLocality: "Bahía Blanca",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+54-9-291-414-5189",
        contactType: "sales",
        areaServed: "AR",
        availableLanguage: ["Spanish"],
      },
    ],
  };
}

/** WebSite: habilita el sitelinks searchbox y refuerza el nombre del sitio. */
export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "DeCarnes",
    inLanguage: "es-AR",
    publisher: { "@id": `${SITE_URL}/#organizacion` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/mercado?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** FAQPage: candidato a rich result de preguntas frecuentes en la SERP. */
export function jsonLdFaq(preguntas: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** Migas de pan para que la SERP muestre la jerarquía en vez de la URL cruda. */
export function jsonLdBreadcrumbs(items: { nombre: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nombre,
      item: absoluta(it.path),
    })),
  };
}

/** Helper para inyectar JSON-LD sin repetir el <script> en cada página. */
export function jsonLdProps(data: object | object[]) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
