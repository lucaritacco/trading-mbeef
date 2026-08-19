import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CORTES, PROVINCIAS } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";
import { inputBase } from "@/lib/ui";
import type { BusquedaLista } from "@/lib/busquedas";

export const metadata: Metadata = {
  title: "Búsquedas | DeCarnes",
  robots: { index: false, follow: false },
};

export default async function BusquedasPage({
  searchParams,
}: {
  searchParams: Promise<{ corte?: string; provincia?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.rpc("busquedas_abiertas", {
    p_corte: sp.corte || null,
    p_provincia: sp.provincia || null,
  });
  const busquedas = (data ?? []) as BusquedaLista[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">El mercado invertido</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Solicitudes de compra</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-texto-sec">
            Lo que los compradores están buscando. Si vendés, respondé con una oferta.
            Distinto del <Link href="/cuenta/mercado" className="text-primario hover:text-texto">Mercado</Link> (donde
            se publican lotes).
          </p>
        </div>
        <Link
          href="/cuenta/busquedas/nueva"
          className="bg-primario px-5 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
        >
          Publicar solicitud
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <Link href="/cuenta/mis-busquedas" className="text-primario transition-colors hover:text-texto">
          Mis solicitudes →
        </Link>
        <Link href="/cuenta/mis-ofertas" className="text-primario transition-colors hover:text-texto">
          Mis ofertas enviadas →
        </Link>
      </div>

      {/* Filtros (GET) */}
      <form className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <select name="corte" defaultValue={sp.corte ?? ""} className={inputBase}>
          <option value="" className="bg-superficie">Corte (todos)</option>
          {CORTES.map((c) => <option key={c} value={c} className="bg-superficie">{c}</option>)}
        </select>
        <select name="provincia" defaultValue={sp.provincia ?? ""} className={inputBase}>
          <option value="" className="bg-superficie">Provincia (todas)</option>
          {PROVINCIAS.map((p) => <option key={p} value={p} className="bg-superficie">{p}</option>)}
        </select>
        <button type="submit" className="bg-primario px-5 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mt-8 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{error.message}</p>
      )}

      {busquedas.length === 0 ? (
        <div className="mt-12 border border-dashed border-borde px-6 py-16 text-center">
          <p className="text-texto">Todavía no hay solicitudes abiertas.</p>
          <p className="mt-1 text-sm text-texto-sec">Publicá la primera y que los frigoríficos te coticen.</p>
          <Link
            href="/cuenta/busquedas/nueva"
            className="mt-6 inline-block bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
          >
            Publicar solicitud
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {busquedas.map((b) => (
            <Link
              key={b.id}
              href={`/cuenta/busquedas/${b.id}`}
              className="flex flex-col border border-borde p-5 transition-colors hover:border-primario"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-serif text-xl font-medium text-texto">{b.tipo_corte ?? "Solicitud"}</h2>
                {b.es_mia && (
                  <span className="shrink-0 border border-primario/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primario">
                    Tuya
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-texto-sec">{b.especie_categoria ?? ""}</p>
              <dl className="mt-3 space-y-1 text-sm text-texto-sec">
                <div>{b.cantidad_kg ? `${b.cantidad_kg} kg` : "Cantidad a definir"}</div>
                <div>{b.provincia ?? "Zona a definir"}{b.plazo_necesario ? ` · ${b.plazo_necesario}` : ""}</div>
                {b.precio_referencia != null && (
                  <div className="text-texto">Ref.: {formatARS(b.precio_referencia)}/kg</div>
                )}
              </dl>
              <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                <span className="text-texto-sec">{b.comprador_empresa ?? ""}</span>
                <span className="uppercase tracking-[0.18em] text-primario">
                  {b.es_mia ? `${b.ofertas_count ?? 0} oferta${b.ofertas_count === 1 ? "" : "s"} →` : "Ofertar →"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
