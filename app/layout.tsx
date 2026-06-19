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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DeCarnes | Publicá tu lote. Nosotros lo vendemos.",
  description:
    "La mesa de compras de MBEEF, abierta al mercado. Publicá tu lote de carne vacuna: te lo compramos en firme o lo colocamos a comisión, con la logística coordinada. Cotización en firme en 24 horas hábiles.",
  openGraph: {
    title: "DeCarnes | Publicá tu lote. Nosotros lo vendemos.",
    description:
      "Cotización en firme en 24 horas hábiles. Operaciones respaldadas por MBEEF · En el mercado de la carne desde 1944.",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/images/hero.jpg" }],
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
