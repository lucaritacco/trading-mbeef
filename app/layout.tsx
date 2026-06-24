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

const title = "DeCarnes | El mercado de la carne, en un solo lugar";
const description =
  "Publicá tus cortes y encontrá los que buscás. El mercado de la carne de todo el país, en un solo lugar. Publicar es gratis. Powered by MBEEF.";

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
