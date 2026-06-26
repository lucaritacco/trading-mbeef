import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import ContactarWhatsapp from "@/components/cuenta/ContactarWhatsapp";
import { CORTES, LOTE_ESTADO, PROVINCIAS, labelDe } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";
import { inputBase } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Mercado | DeCarnes",
  robots: { index: false, follow: false },
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
  empresa: string | null;
};

export default async function MercadoPage({
  searchParams,
}: {
  searchParams: Promise<{ corte?: string; provincia?: string; estado?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.rpc("catalogo", {
    p_corte: sp.corte || null,
    p_provincia: sp.provincia || null,
    p_estado: sp.estado || null,
    p_q: sp.q || null,
  });
  const lotes = (data ?? []) as Fila[];

  // Firmar la foto principal de cada lote (bucket privado).
  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const { data: s } = await supabase.storage
        .from("lotes-fotos")
        .createSignedUrl(l.foto_principal, 3600);
      if (s?.signedUrl) fotos.set(l.id, s.signedUrl);
    }),
  );

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mercado</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Catálogo de lotes</h1>
      <p className="mt-2 text-sm text-taupe">{lotes.length} lote{lotes.length === 1 ? "" : "s"} publicado{lotes.length === 1 ? "" : "s"}.</p>

      {/* Filtros (GET) */}
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
        <p className="mt-12 text-sm text-taupe">No hay lotes que coincidan.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lotes.map((l) => {
            const foto = fotos.get(l.id);
            return (
              <div key={l.id} className="flex flex-col border border-hueso/15">
                <Link href={`/lote/${l.id}`} target="_blank" className="block aspect-[4/3] overflow-hidden bg-carbon/40">
                  {foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={foto} alt={l.titulo ?? "Lote"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-taupe/50">Sin foto</span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-xl font-medium text-hueso">{l.titulo ?? "—"}</h2>
                  <p className="mt-1 text-sm text-taupe">
                    {[l.corte, l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado)].filter(Boolean).join(" · ")}
                  </p>
                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-taupe">
                    {l.kilos_totales && <span>{l.kilos_totales} kg</span>}
                    <span>{[l.ubicacion_localidad, l.ubicacion_provincia].filter(Boolean).join(", ") || "—"}</span>
                  </dl>
                  {l.precio_pretendido_kg && (
                    <p className="mt-2 font-serif text-lg text-hueso">
                      {formatARS(l.precio_pretendido_kg)}<span className="text-sm text-taupe"> /kg</span>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-taupe/70">{l.empresa ?? ""}</p>
                  <div className="mt-auto pt-4">
                    <ContactarWhatsapp loteId={l.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
