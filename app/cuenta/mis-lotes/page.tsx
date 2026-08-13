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
          <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Mercado</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Mis lotes</h1>
        </div>
        <Link href="/cuenta/publicar" className="bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
          Publicar lote
        </Link>
      </div>

      {error && (
        <p className="mt-8 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{error.message}</p>
      )}

      {lotes.length === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">Todavía no publicaste ningún lote.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {lotes.map((l) => {
            const foto = fotos.get(l.id);
            return (
              <div key={l.id} className="flex flex-col gap-4 border border-borde p-4 sm:flex-row sm:items-center">
                <div className="h-20 w-28 shrink-0 overflow-hidden bg-fondo">
                  {foto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={foto} alt={l.titulo ?? "Lote"} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-medium text-texto">{l.titulo ?? "—"}</h2>
                    <span className={`border px-2 py-0.5 text-[11px] ${l.publico ? "border-exito/40 text-exito" : "border-borde text-texto-sec"}`}>
                      {l.publico ? "Publicado" : "Despublicado"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-texto-sec">
                    {[l.corte, l.kilos_totales ? `${l.kilos_totales} kg` : null, l.ubicacion_provincia, formatARS(l.precio_pretendido_kg)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-texto-sec">Publicado el {formatFecha(l.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {l.publico && (
                    <Link href={`/lote/${l.id}`} target="_blank" className="border border-borde px-3 py-1.5 text-xs text-texto transition-colors hover:border-primario">
                      Ver ficha
                    </Link>
                  )}
                  <Link href={`/cuenta/publicar?id=${l.id}`} className="border border-borde px-3 py-1.5 text-xs text-texto transition-colors hover:border-primario">
                    Editar
                  </Link>
                  <form action={setPublicoLote}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="publico" value={l.publico ? "false" : "true"} />
                    <button className="border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors hover:border-borde hover:text-texto">
                      {l.publico ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={eliminarLote}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors hover:border-error hover:text-primario">
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
