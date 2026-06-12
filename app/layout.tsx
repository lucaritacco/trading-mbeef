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

export const metadata: Metadata = {
  title: "DeCarnes | Publicá tu lote. Nosotros lo vendemos.",
  description:
    "La mesa de compras de MBEEF, abierta al mercado. Publicá tu lote de carne: lo colocamos, garantizamos el cobro y coordinamos la logística. Oferta en firme en menos de 24 horas hábiles.",
  openGraph: {
    title: "DeCarnes | Publicá tu lote. Nosotros lo vendemos.",
    description:
      "Oferta en firme en menos de 24 horas hábiles. Operaciones respaldadas por MBEEF, frigorífico en actividad.",
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
