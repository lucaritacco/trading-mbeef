import type { Metadata } from "next";
import { EB_Garamond, Archivo } from "next/font/google";
import "./globals.css";
import RegistrarVisita from "@/components/RegistrarVisita";
import {
  SITE_URL,
  jsonLdOrganizacion,
  jsonLdProps,
  jsonLdWebSite,
} from "@/lib/seo";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

// La URL canónica vive en lib/seo.ts: de ahí salen metadataBase, canonicals,
// sitemap, robots y JSON-LD, para que Google vea siempre el mismo dominio.
const siteUrl = SITE_URL;

const title = "DeCarnes | Lotes de frigoríficos seleccionados";
const description =
  "Comprá directo del catálogo de lotes de frigoríficos seleccionados. ¿Vendés? Pasanos tu stock: lo publicamos y lo colocamos en nuestra red de compradores. Powered by MBEEF, operador del mercado desde 1994.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    // Las páginas internas ya traen su propio título completo.
    template: "%s",
  },
  description,
  applicationName: "DeCarnes",
  // Verificación de propiedad en Google Search Console.
  verification: {
    google: "7Swty7K4H-q4uXjOAs4CefThkVxF4pKEiwy2qhau5MU",
  },
  keywords: [
    "lotes de carne",
    "carne vacuna mayorista",
    "frigoríficos argentina",
    "comprar carne por mayor",
    "mercado de carne",
    "MBEEF",
  ],
  // El canonical NO va acá: en el App Router los hijos heredan `alternates`
  // del layout, y todas las páginas terminarían apuntando a la home. Cada
  // página define el suyo (ver app/page.tsx, /mercado, /enterate, /sumate, /lote).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    url: siteUrl,
    siteName: "DeCarnes",
    title,
    description,
    locale: "es_AR",
    type: "website",
    images: [{ url: "/images/hero.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/hero.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${garamond.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        {/* Identidad del sitio para Google: quién es DeCarnes y de quién depende. */}
        <script {...jsonLdProps([jsonLdOrganizacion(), jsonLdWebSite()])} />
      </head>
      <body className="min-h-full flex flex-col">
        <RegistrarVisita />
        {children}
      </body>
    </html>
  );
}
