import type { Metadata } from "next";
import TopBar from "@/components/home/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroMarketplace from "@/components/home/HeroMarketplace";
import Pilares from "@/components/home/Pilares";
import DosCaminos from "@/components/home/DosCaminos";
import LotesDisponibles from "@/components/home/LotesDisponibles";
import SolicitudesAbiertas, { type SolicitudPublica } from "@/components/home/SolicitudesAbiertas";
import ComoFuncionaDual from "@/components/home/ComoFuncionaDual";
import FranjaMbeef from "@/components/home/FranjaMbeef";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { firmarFoto, type LoteFila } from "@/lib/ficha";
import { absoluta, jsonLdProps } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const RECIENTES = 3;
const EN_HERO = 3;

export default async function Home() {
  // Sesión: decide los CTAs del hero y si las tarjetas muestran precio.
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  // Catálogo público (anónimo, sin precio), ya ordenado por fecha desc, y la
  // vitrina de demanda (solicitudes aprobadas, también anónimas).
  const [{ data }, { data: sols }, { data: totalSols }] = await Promise.all([
    supabase.rpc("catalogo_publico", {}),
    supabase.rpc("solicitudes_publicas", { p_limite: 5 }),
    supabase.rpc("solicitudes_abiertas_count"),
  ]);
  const solicitudes = (sols ?? []) as SolicitudPublica[];
  const lotes = ((data ?? []) as LoteFila[]).slice(0, RECIENTES);

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  const listaJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Últimos lotes publicados en DeCarnes",
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
      <TopBar />
      <Header logueado={logueado} />
      <main>
        <HeroMarketplace lotes={lotes.slice(0, EN_HERO)} fotos={fotos} logueado={logueado} />
        <Pilares />
        <DosCaminos />
        <LotesDisponibles lotes={lotes} fotos={fotos} logueado={logueado} />
        <SolicitudesAbiertas
          solicitudes={solicitudes}
          total={Number(totalSols ?? solicitudes.length)}
          logueado={logueado}
        />
        <ComoFuncionaDual />
        <FranjaMbeef />
      </main>
      <Footer />
    </>
  );
}
