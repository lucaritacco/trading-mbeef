import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatARS, formatFecha } from "@/lib/panel";
import type { MiOferta } from "@/lib/busquedas";

export const metadata: Metadata = {
  title: "Mis ofertas | DeCarnes",
  robots: { index: false, follow: false },
};

const ESTADO_BADGE: Record<string, string> = {
  enviada: "border-hueso/25 text-taupe",
  aceptada: "border-verde-claro/50 text-verde-claro",
  rechazada: "border-rojo/40 text-rojo-claro",
};

export default async function MisOfertasPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("mis_ofertas");
  const ofertas = (data ?? []) as MiOferta[];

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Búsquedas</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">Mis ofertas enviadas</h1>

      {ofertas.length === 0 ? (
        <p className="mt-12 text-sm text-taupe">
          Todavía no enviaste ofertas.{" "}
          <Link href="/cuenta/busquedas" className="text-salmon hover:text-hueso">Mirá las búsquedas abiertas.</Link>
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-hueso/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-hueso/10 text-left text-[11px] uppercase tracking-[0.16em] text-taupe">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Búsqueda</th>
                <th className="px-4 py-3 font-normal">Mi precio/kg</th>
                <th className="px-4 py-3 font-normal">Cantidad</th>
                <th className="px-4 py-3 font-normal">Plazo</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {ofertas.map((o) => (
                <tr key={o.id} className="border-b border-hueso/5">
                  <td className="px-4 py-3 text-taupe">{formatFecha(o.created_at)}</td>
                  <td className="px-4 py-3 text-hueso">
                    {o.busqueda_corte ?? "—"}
                    {o.busqueda_cantidad ? <span className="text-taupe"> · {o.busqueda_cantidad} kg</span> : null}
                  </td>
                  <td className="px-4 py-3 font-serif text-base text-hueso">
                    {o.precio_por_kg != null ? formatARS(o.precio_por_kg) : "—"}
                  </td>
                  <td className="px-4 py-3 text-taupe">{o.cantidad_ofrecida_kg != null ? `${o.cantidad_ofrecida_kg} kg` : "—"}</td>
                  <td className="px-4 py-3 text-taupe">{o.plazo_entrega ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`border px-2 py-1 text-xs ${ESTADO_BADGE[o.estado] ?? "text-taupe"}`}>
                      {o.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/cuenta/busquedas/${o.busqueda_id}`} className="text-salmon transition-colors hover:text-hueso">
                      Ver →
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
