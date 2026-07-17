import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { firmarFoto } from "@/lib/ficha";
import { CORTES, LOTE_ESTADO, PROVINCIAS, labelDe } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";
import { inputBase } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Mercado de lotes | DeCarnes",
  description:
    "Mirá los lotes de carne publicados en DeCarnes: cortes, cantidades, provincia y precio. Consultá sin registrarte. Powered by MBEEF.",
};

type Fila = {
  id: string;
  titulo: string | null;
  corte: string | null;
  especie_categoria: string | null;
  lote_estado: string | null;
  precio_pretendido_kg: number | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  ubicacion_localidad: string | null;
  foto_principal: string | null;
};

export default async function MercadoPublicoPage({
  searchParams,
}: {
  searchParams: Promise<{ corte?: string; provincia?: string; estado?: string; q?: string }>;
}) {
  const sp = await searchParams;

  const { data, error } = await supabase.rpc("catalogo_publico", {
    p_corte: sp.corte || null,
    p_provincia: sp.provincia || null,
    p_estado: sp.estado || null,
    p_q: sp.q || null,
  });
  const lotes = (data ?? []) as Fila[];

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  return (
    <>
      <Header />
      <main className="min-h-svh">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">El mercado de la carne</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Lotes publicados</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-taupe">
            Mirá los lotes disponibles y consultá por el que te interese. Para
            publicar los tuyos,{" "}
            <Link href="/sumate" className="text-salmon hover:text-hueso">sumate al mercado</Link>.
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
              {lotes.map((l) => {
                const foto = fotos.get(l.id);
                return (
                  <Link key={l.id} href={`/lote/${l.id}`} className="group flex flex-col border border-hueso/15 transition-colors hover:border-bordo">
                    <div className="aspect-[4/3] overflow-hidden bg-carbon/40">
                      {foto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={foto} alt={l.titulo ?? "Lote"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-taupe/50">Sin foto</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-serif text-xl font-medium text-hueso group-hover:text-rojo-claro">{l.titulo ?? "—"}</h2>
                      <p className="mt-1 text-sm text-taupe">
                        {[l.corte, l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado)].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-3 text-sm text-taupe">
                        {[l.kilos_totales ? `${l.kilos_totales} kg` : null, [l.ubicacion_localidad, l.ubicacion_provincia].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {l.precio_pretendido_kg && (
                        <p className="mt-2 font-serif text-lg text-hueso">
                          {formatARS(l.precio_pretendido_kg)}<span className="text-sm text-taupe"> /kg</span>
                        </p>
                      )}
                      <span className="mt-auto pt-4 text-xs uppercase tracking-[0.18em] text-salmon">Ver y consultar →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
