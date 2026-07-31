import type { Metadata } from "next";
import { EB_Garamond, Archivo } from "next/font/google";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

// Default a la URL de producción para que las OG/Twitter sean absolutas (no localhost).
// En Vercel se puede sobreescribir con NEXT_PUBLIC_SITE_URL (dominio propio).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trading-mbeef.vercel.app";

const title = "DeCarnes | Lotes de frigoríficos seleccionados";
const description =
  "Comprá directo del catálogo de lotes de frigoríficos seleccionados. ¿Vendés? Pasanos tu stock: lo publicamos y lo colocamos en nuestra red de compradores. Powered by MBEEF, operador del mercado desde 1994.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
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
      lang="es"
      className={`${garamond.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
