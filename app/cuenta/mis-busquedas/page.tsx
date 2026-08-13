import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/panel";
import type { MiBusqueda } from "@/lib/busquedas";

export const metadata: Metadata = {
  title: "Mis búsquedas | DeCarnes",
  robots: { index: false, follow: false },
};

export default async function MisBusquedasPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("mis_busquedas");
  const busquedas = (data ?? []) as MiBusqueda[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Búsquedas</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Mis búsquedas</h1>
        </div>
        <Link href="/cuenta/busquedas/nueva" className="bg-primario px-5 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
          Publicar una búsqueda
        </Link>
      </div>

      {busquedas.length === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">
          Todavía no publicaste búsquedas.{" "}
          <Link href="/cuenta/busquedas/nueva" className="text-primario hover:text-texto">Publicá la primera.</Link>
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-borde">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Corte</th>
                <th className="px-4 py-3 font-normal">Cantidad</th>
                <th className="px-4 py-3 font-normal">Zona</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Ofertas</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {busquedas.map((b) => (
                <tr key={b.id} className="border-b border-borde">
                  <td className="px-4 py-3 text-texto-sec">{formatFecha(b.created_at)}</td>
                  <td className="px-4 py-3 text-texto">{b.tipo_corte ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{b.cantidad_kg ? `${b.cantidad_kg} kg` : "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{b.provincia ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`border px-2 py-1 text-xs ${b.estado === "abierta" ? "border-exito/40 text-exito" : "border-borde text-texto-sec"}`}>
                      {b.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-texto">{b.ofertas_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link href={`/cuenta/busquedas/${b.id}`} className="text-primario transition-colors hover:text-texto">
                      Ver ofertas →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
