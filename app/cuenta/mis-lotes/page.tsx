import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setPublicoLote, eliminarLote } from "../actions";
import { formatARS, formatFecha } from "@/lib/panel";

export const metadata: Metadata = {
  title: "Mis lotes | DeCarnes",
  robots: { index: false, follow: false },
};

type Lote = {
  id: string;
  titulo: string | null;
  corte: string | null;
  lote_estado: string | null;
  precio_pretendido_kg: number | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  publico: boolean | null;
  created_at: string;
  fotos_paths: string[] | null;
};

export default async function MisLotesPage() {
  const supabase = await createSupabaseServer();
  // RLS "lotes own select" limita a los lotes del usuario (user_id = auth.uid()).
  const { data, error } = await supabase
    .from("lotes")
    .select("id, titulo, corte, lote_estado, precio_pretendido_kg, kilos_totales, ubicacion_provincia, publico, created_at, fotos_paths")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });
  const lotes = (data ?? []) as Lote[];

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      const path = l.fotos_paths?.[0];
      if (!path) return;
      const { data: s } = await supabase.storage.from("lotes-fotos").createSignedUrl(path, 3600);
      if (s?.signedUrl) fotos.set(l.id, s.signedUrl);
    }),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mercado</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Mis lotes</h1>
        </div>
        <Link href="/cuenta/publicar" className="bg-bordo px-5 py-2.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo">
          Publicar lote
        </Link>
      </div>

      {error && (
        <p className="mt-8 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error.message}</p>
      )}

      {lotes.length === 0 ? (
        <p className="mt-12 text-sm text-taupe">Todavía no publicaste ningún lote.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {lotes.map((l) => {
            const foto = fotos.get(l.id);
            return (
              <div key={l.id} className="flex flex-col gap-4 border border-hueso/15 p-4 sm:flex-row sm:items-center">
                <div className="h-20 w-28 shrink-0 overflow-hidden bg-carbon/40">
                  {foto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={foto} alt={l.titulo ?? "Lote"} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-medium text-hueso">{l.titulo ?? "—"}</h2>
                    <span className={`border px-2 py-0.5 text-[11px] ${l.publico ? "border-verde-claro/50 text-verde-claro" : "border-hueso/20 text-taupe"}`}>
                      {l.publico ? "Publicado" : "Despublicado"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-taupe">
                    {[l.corte, l.kilos_totales ? `${l.kilos_totales} kg` : null, l.ubicacion_provincia, formatARS(l.precio_pretendido_kg)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-taupe/60">Publicado el {formatFecha(l.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {l.publico && (
                    <Link href={`/lote/${l.id}`} target="_blank" className="border border-hueso/25 px-3 py-1.5 text-xs text-hueso transition-colors hover:border-salmon">
                      Ver ficha
                    </Link>
                  )}
                  <Link href={`/cuenta/publicar?id=${l.id}`} className="border border-hueso/25 px-3 py-1.5 text-xs text-hueso transition-colors hover:border-salmon">
                    Editar
                  </Link>
                  <form action={setPublicoLote}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="publico" value={l.publico ? "false" : "true"} />
                    <button className="border border-hueso/25 px-3 py-1.5 text-xs text-taupe transition-colors hover:border-hueso hover:text-hueso">
                      {l.publico ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={eliminarLote}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="border border-hueso/25 px-3 py-1.5 text-xs text-taupe transition-colors hover:border-rojo hover:text-rojo-claro">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
