import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatARS, formatFecha } from "@/lib/panel";

type LoteVendido = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  corte: string | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  vendido_at: string | null;
  venta_kg: number | null;
  venta_precio_kg: number | null;
  venta_notas: string | null;
};

const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** Monto de la operación. null si falta algún dato (son opcionales al registrar). */
function montoDe(l: LoteVendido): number | null {
  if (l.venta_kg == null || l.venta_precio_kg == null) return null;
  return l.venta_kg * l.venta_precio_kg;
}

export default async function OperacionesPage() {
  const supabase = await createSupabaseServer();

  // RLS "lotes staff select" habilita al staff a ver todos los lotes.
  const { data, error } = await supabase
    .from("lotes")
    .select(
      "id, user_id, titulo, corte, kilos_totales, ubicacion_provincia, vendido_at, venta_kg, venta_precio_kg, venta_notas",
    )
    .eq("vendido", true)
    .order("vendido_at", { ascending: false });
  const ventas = (data ?? []) as LoteVendido[];

  // Nombre del frigorífico de cada venta (lotes.user_id apunta a auth.users, así
  // que no hay FK con `usuarios`: se resuelve con una segunda consulta).
  const ids = [...new Set(ventas.map((v) => v.user_id).filter(Boolean))] as string[];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: us } = await supabase
      .from("usuarios")
      .select("id, empresa, nombre_fantasia, razon_social")
      .in("id", ids);
    for (const u of us ?? []) {
      nombres.set(u.id, u.nombre_fantasia || u.razon_social || u.empresa || "—");
    }
  }

  const totalKg = ventas.reduce((a, v) => a + (v.venta_kg ?? 0), 0);
  const totalMonto = ventas.reduce((a, v) => a + (montoDe(v) ?? 0), 0);
  const sinDatos = ventas.filter((v) => montoDe(v) === null).length;

  // Scorecard por frigorífico: quién mueve de verdad.
  const porFrigo = new Map<string, { nombre: string; ops: number; kg: number; monto: number }>();
  for (const v of ventas) {
    const id = v.user_id ?? "—";
    const actual = porFrigo.get(id) ?? {
      nombre: nombres.get(id) ?? "—",
      ops: 0,
      kg: 0,
      monto: 0,
    };
    actual.ops += 1;
    actual.kg += v.venta_kg ?? 0;
    actual.monto += montoDe(v) ?? 0;
    porFrigo.set(id, actual);
  }
  const ranking = [...porFrigo.entries()].sort((a, b) => b[1].monto - a[1].monto);

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-texto">Operaciones cerradas</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto-sec">
        Lo que cada frigorífico marcó como vendido. Los kg y el precio final son
        opcionales al registrar la venta, así que puede haber operaciones sin monto.
      </p>

      {error && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">
          {error.message}
        </p>
      )}

      {ventas.length === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">
          Todavía no hay ventas registradas. Aparecen acá cuando un vendedor marca un
          lote como vendido desde “Mis lotes”.
        </p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-borde py-6 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Operaciones</dt>
              <dd className="mt-1 font-serif text-3xl text-texto">{ventas.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Kilos vendidos</dt>
              <dd className="mt-1 font-serif text-3xl text-texto">{kg.format(totalKg)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Monto declarado</dt>
              <dd className="mt-1 font-serif text-3xl text-texto">{formatARS(totalMonto)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Sin monto</dt>
              <dd className="mt-1 font-serif text-3xl text-texto">{sinDatos}</dd>
            </div>
          </dl>

          {ranking.length > 1 && (
            <>
              <h2 className="mt-12 font-serif text-2xl font-medium text-texto">Por frigorífico</h2>
              <div className="mt-4 overflow-x-auto border border-borde">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                      <th className="px-4 py-3 font-normal">Frigorífico</th>
                      <th className="px-4 py-3 font-normal">Operaciones</th>
                      <th className="px-4 py-3 font-normal">Kilos</th>
                      <th className="px-4 py-3 font-normal">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map(([id, r]) => (
                      <tr key={id} className="border-b border-borde/60">
                        <td className="px-4 py-3 text-texto">{r.nombre}</td>
                        <td className="px-4 py-3 text-texto-sec">{r.ops}</td>
                        <td className="px-4 py-3 text-texto-sec">{kg.format(r.kg)} kg</td>
                        <td className="px-4 py-3 font-serif text-base text-texto">
                          {formatARS(r.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h2 className="mt-12 font-serif text-2xl font-medium text-texto">Detalle</h2>
          <div className="mt-4 overflow-x-auto border border-borde">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                  <th className="px-4 py-3 font-normal">Fecha</th>
                  <th className="px-4 py-3 font-normal">Frigorífico</th>
                  <th className="px-4 py-3 font-normal">Lote</th>
                  <th className="px-4 py-3 font-normal">Kg</th>
                  <th className="px-4 py-3 font-normal">Precio/kg</th>
                  <th className="px-4 py-3 font-normal">Monto</th>
                  <th className="px-4 py-3 font-normal">Nota</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const monto = montoDe(v);
                  return (
                    <tr key={v.id} className="border-b border-borde/60 align-top">
                      <td className="px-4 py-3 text-texto-sec">{formatFecha(v.vendido_at)}</td>
                      <td className="px-4 py-3 text-texto">{nombres.get(v.user_id ?? "") ?? "—"}</td>
                      <td className="px-4 py-3 text-texto">
                        <Link href={`/panel/lote/${v.id}`} className="hover:text-primario">
                          {v.titulo ?? v.corte ?? "—"}
                        </Link>
                        <span className="block text-xs text-texto-sec">
                          {[v.corte, v.ubicacion_provincia].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-texto-sec">
                        {v.venta_kg != null ? `${kg.format(v.venta_kg)} kg` : "—"}
                        {v.venta_kg == null && v.kilos_totales != null && (
                          <span className="block text-xs text-texto-sec/70">
                            publicó {kg.format(v.kilos_totales)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-texto-sec">
                        {v.venta_precio_kg != null ? formatARS(v.venta_precio_kg) : "—"}
                      </td>
                      <td className="px-4 py-3 font-serif text-base text-texto">
                        {monto != null ? formatARS(monto) : <span className="text-texto-sec">—</span>}
                      </td>
                      <td className="max-w-[26ch] px-4 py-3 text-xs text-texto-sec">
                        {v.venta_notas ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
