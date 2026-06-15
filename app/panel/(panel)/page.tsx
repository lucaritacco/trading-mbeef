import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  PIPELINE,
  pipelineLabel,
  semaforo,
  CONFIG_DEFAULT,
  formatARS,
  formatFecha,
  type Config,
  type Lote,
} from "@/lib/panel";

const COLOR_PUNTO: Record<string, string> = {
  rojo: "bg-rojo",
  amarillo: "bg-salmon",
  verde: "bg-verde-claro",
  gris: "bg-taupe/40",
};

export default async function PanelLotes({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: configRow } = await supabase.from("config").select("*").maybeSingle();
  const config: Config = configRow ?? CONFIG_DEFAULT;

  let query = supabase
    .from("lotes")
    .select("*")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  const lotes = (data ?? []) as Lote[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-hueso">Lotes entrantes</h1>
          <p className="mt-1 text-sm text-taupe">{lotes.length} lote{lotes.length === 1 ? "" : "s"}{estado ? ` · ${pipelineLabel(estado)}` : ""}</p>
        </div>
      </div>

      {/* Filtro por estado del pipeline */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FiltroChip activo={!estado} href="/panel" label="Todos" />
        {PIPELINE.map((p) => (
          <FiltroChip key={p.value} activo={estado === p.value} href={`/panel?estado=${p.value}`} label={p.label} />
        ))}
      </div>

      {error && (
        <p className="mt-8 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error.message}</p>
      )}

      {lotes.length === 0 ? (
        <p className="mt-12 text-sm text-taupe">No hay lotes para mostrar.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-hueso/10">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-hueso/10 text-left text-[11px] uppercase tracking-[0.16em] text-taupe">
                <th className="px-4 py-3 font-normal">Ingreso</th>
                <th className="px-4 py-3 font-normal">Contacto</th>
                <th className="px-4 py-3 font-normal">Producto</th>
                <th className="px-4 py-3 font-normal">Kg</th>
                <th className="px-4 py-3 font-normal">Ubicación</th>
                <th className="px-4 py-3 font-normal">Pretendido/kg</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Legajo</th>
                <th className="px-4 py-3 font-normal">Sugerido</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => {
                const s = semaforo(l.margen_bruto_pct, config);
                return (
                  <tr key={l.id} className="group border-b border-hueso/5 transition-colors hover:bg-hueso/[0.03]">
                    <td className="px-4 py-3 text-taupe">
                      <Link href={`/panel/lote/${l.id}`} className="block text-hueso group-hover:text-rojo-claro">
                        {formatFecha(l.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/panel/lote/${l.id}`} className="block">
                        <span className="text-hueso">{l.contacto_nombre ?? "—"}</span>
                        <span className="block text-xs text-taupe">{l.cuit ?? ""}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-taupe">{l.especie_categoria ?? l.tipo_producto ?? "—"}</td>
                    <td className="px-4 py-3 text-taupe">{l.kilos_totales ?? "—"}</td>
                    <td className="px-4 py-3 text-taupe">{[l.ubicacion_localidad, l.ubicacion_provincia].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-taupe">{formatARS(l.precio_pretendido_kg)}</td>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap border border-hueso/20 px-2 py-1 text-xs text-hueso">{pipelineLabel(l.estado)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${l.legajo_estado === "completo" ? "text-verde-claro" : "text-taupe"}`}>
                        {l.legajo_estado === "completo" ? "Completo" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs text-taupe">
                        <span className={`h-2 w-2 rounded-full ${COLOR_PUNTO[s.color]}`} />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FiltroChip({ activo, href, label }: { activo: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`border px-3.5 py-1.5 text-xs transition-colors ${
        activo ? "border-bordo bg-bordo/15 text-hueso" : "border-hueso/20 text-taupe hover:border-hueso/45 hover:text-hueso"
      }`}
    >
      {label}
    </Link>
  );
}
