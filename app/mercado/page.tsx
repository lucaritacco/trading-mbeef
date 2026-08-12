import type { Metadata } from "next";
import Header from "@/components/Header";
import LoteCard from "@/components/LoteCard";
import { supabase } from "@/lib/supabase";
import { firmarFoto, getPrecios, type LoteFila } from "@/lib/ficha";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CORTES, LOTE_ESTADO, PROVINCIAS } from "@/lib/opciones";
import { inputBase } from "@/lib/ui";
import { site } from "@/lib/site";
import { absoluta, jsonLdBreadcrumbs, jsonLdProps } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mercado de lotes | DeCarnes",
  description:
    "Mirá los lotes de carne publicados en DeCarnes: cortes, cantidades, provincia y precio. Consultá sin registrarte. Powered by MBEEF.",
  // Los filtros (?corte=&provincia=&estado=&q=) generan decenas de URLs con el
  // mismo contenido. El canónico apunta siempre a la versión sin parámetros
  // para que Google no gaste crawl budget ni las trate como duplicados.
  alternates: { canonical: "/mercado" },
  openGraph: {
    title: "Mercado de lotes | DeCarnes",
    description:
      "Lotes de carne de frigoríficos seleccionados: cortes, cantidades, provincia y precio.",
    url: absoluta("/mercado"),
  },
};

export default async function MercadoPublicoPage({
  searchParams,
}: {
  searchParams: Promise<{ corte?: string; provincia?: string; estado?: string; q?: string }>;
}) {
  const sp = await searchParams;

  // Sesión: el catálogo es público, pero el precio de cada tarjeta solo se
  // muestra con cuenta (precios_lotes está revocada para anon).
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  const { data, error } = await supabase.rpc("catalogo_publico", {
    p_corte: sp.corte || null,
    p_provincia: sp.provincia || null,
    p_estado: sp.estado || null,
    p_q: sp.q || null,
  });
  const lotes = (data ?? []) as LoteFila[];

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  const precios = logueado
    ? await getPrecios(supabaseServer, lotes.map((l) => l.id))
    : new Map<string, number>();

  // ItemList: le da a Google la estructura del catálogo (cada lote es una
  // entrada con su URL), lo que ayuda a que descubra las fichas más rápido.
  const listaJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Lotes publicados en DeCarnes",
    numberOfItems: lotes.length,
    itemListElement: lotes.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluta(`/lote/${l.id}`),
    })),
  };

  return (
    <>
      <script
        {...jsonLdProps([
          jsonLdBreadcrumbs([
            { nombre: "Inicio", path: "/" },
            { nombre: "Lotes publicados", path: "/mercado" },
          ]),
          listaJsonLd,
        ])}
      />
      <Header logueado={logueado} />
      <main className="min-h-svh">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">El mercado de la carne</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Lotes publicados</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-taupe">
            Lotes de frigoríficos seleccionados. Consultá por el que te interese.
            ¿Tenés stock para vender?{" "}
            <a href={site.whatsappVenderHref} target="_blank" rel="noopener noreferrer" className="text-salmon hover:text-hueso">
              Escribinos y lo publicamos
            </a>.
          </p>

          {/* Filtros (GET, funcionan sin login) */}
          <form className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar…" className={inputBase} />
            <select name="corte" defaultValue={sp.corte ?? ""} className={inputBase}>
              <option value="" className="bg-carbon">Corte (todos)</option>
              {CORTES.map((c) => <option key={c} value={c} className="bg-carbon">{c}</option>)}
            </select>
            <select name="provincia" defaultValue={sp.provincia ?? ""} className={inputBase}>
              <option value="" className="bg-carbon">Provincia (todas)</option>
              {PROVINCIAS.map((p) => <option key={p} value={p} className="bg-carbon">{p}</option>)}
            </select>
            <select name="estado" defaultValue={sp.estado ?? ""} className={inputBase}>
              <option value="" className="bg-carbon">Estado (todos)</option>
              {LOTE_ESTADO.map((e) => <option key={e.value} value={e.value} className="bg-carbon">{e.label}</option>)}
            </select>
            <button type="submit" className="bg-bordo px-5 py-3 text-sm font-medium text-hueso transition-colors hover:bg-rojo">
              Filtrar
            </button>
          </form>

          {error && (
            <p className="mt-8 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error.message}</p>
          )}

          {lotes.length === 0 ? (
            <p className="mt-12 text-sm text-taupe">
              Todavía no hay lotes publicados que coincidan. Volvé pronto.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lotes.map((l) => (
                <LoteCard key={l.id} l={l} foto={fotos.get(l.id)} precio={precios.get(l.id)} logueado={logueado} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
