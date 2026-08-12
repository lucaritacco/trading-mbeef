import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BarraVendedor from "@/components/home/BarraVendedor";
import HeroMercado from "@/components/home/HeroMercado";
import CategoriasCorte from "@/components/home/CategoriasCorte";
import GrillaDestacados from "@/components/home/GrillaDestacados";
import QueEsDeCarnes from "@/components/home/QueEsDeCarnes";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { firmarFoto, getMetricas, getPrecios, type LoteFila } from "@/lib/ficha";
import { absoluta, jsonLdProps } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const DESTACADOS = 6;

export default async function Home() {
  // Sesión: decide la barra de vendedor y si las tarjetas muestran precio.
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  // Catálogo público (anónimo, sin precio) + métrica de volumen.
  const [{ data }, metrica] = await Promise.all([
    supabase.rpc("catalogo_publico", {}),
    getMetricas(),
  ]);
  const lotes = ((data ?? []) as LoteFila[]).slice(0, DESTACADOS);

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  // El precio solo se pide con sesión (precios_lotes está revocada para anon).
  const precios = logueado
    ? await getPrecios(supabaseServer, lotes.map((l) => l.id))
    : new Map<string, number>();

  const listaJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Lotes destacados en DeCarnes",
    numberOfItems: lotes.length,
    itemListElement: lotes.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluta(`/lote/${l.id}`),
    })),
  };

  return (
    <>
      <script {...jsonLdProps(listaJsonLd)} />
      <Header logueado={logueado} />
      <main>
        {logueado && <BarraVendedor />}
        <HeroMercado metrica={metrica} />
        <CategoriasCorte />
        <GrillaDestacados lotes={lotes} fotos={fotos} precios={precios} logueado={logueado} />
        <QueEsDeCarnes />
      </main>
      <Footer />
    </>
  );
}
