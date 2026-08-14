import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setEstadoBusqueda } from "../../actions";
import { formatARS, formatFecha } from "@/lib/panel";

type Busqueda = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
  precio_referencia: number | null;
  notas: string | null;
  estado: string;
};

const ESTADOS = [
  { value: "pendiente", label: "Pendientes" },
  { value: "abierta", label: "Publicadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "cerrada", label: "Cerradas" },
];

const COLOR: Record<string, string> = {
  pendiente: "border-acento text-texto",
  abierta: "border-exito/50 text-exito",
  rechazada: "border-error/40 text-error",
  cerrada: "border-borde text-texto-sec",
};

export default async function SolicitudesCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; ok?: string }>;
}) {
  const { estado, ok } = await searchParams;
  const supabase = await createSupabaseServer();

  let q = supabase
    .from("busquedas")
    .select("id, created_at, tipo_corte, especie_categoria, cantidad_kg, provincia, plazo_necesario, precio_referencia, notas, estado")
    .order("created_at", { ascending: false });
  if (estado) q = q.eq("estado", estado);

  const { data, error } = await q;
  const busquedas = (data ?? []) as Busqueda[];

  const { count: pendientes } = await supabase
    .from("busquedas")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-texto">Solicitudes de compra</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto-sec">
        Lo que publican los compradores. Nacen pendientes: <span className="text-texto">ningún
        vendedor las ve</span> hasta que las publiques.{" "}
        {(pendientes ?? 0) > 0 && (
          <span className="text-texto">{pendientes} esperando revisión.</span>
        )}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip activo={!estado} href="/panel/solicitudes-compra" label="Todas" />
        {ESTADOS.map((e) => (
          <Chip
            key={e.value}
            activo={estado === e.value}
            href={`/panel/solicitudes-compra?estado=${e.value}`}
            label={e.label}
          />
        ))}
      </div>

      {ok && (
        <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Solicitud actualizada.
        </p>
      )}
      {error && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">
          {error.message}
        </p>
      )}

      {busquedas.length === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">No hay solicitudes para mostrar.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-borde">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Busca</th>
                <th className="px-4 py-3 font-normal">Cantidad</th>
                <th className="px-4 py-3 font-normal">Zona</th>
                <th className="px-4 py-3 font-normal">Plazo</th>
                <th className="px-4 py-3 font-normal">Ref.</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {busquedas.map((b) => (
                <tr key={b.id} className="border-b border-borde/60 align-top">
                  <td className="px-4 py-3 text-texto-sec">{formatFecha(b.created_at)}</td>
                  <td className="px-4 py-3 text-texto">
                    {b.tipo_corte ?? "—"}
                    {b.especie_categoria && (
                      <span className="block text-xs text-texto-sec">{b.especie_categoria}</span>
                    )}
                    {b.notas && (
                      <span className="mt-1 block max-w-[32ch] text-xs text-texto-sec/80">{b.notas}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-texto-sec">{b.cantidad_kg ? `${b.cantidad_kg} kg` : "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{b.provincia ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{b.plazo_necesario ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">
                    {b.precio_referencia != null ? `${formatARS(b.precio_referencia)}/kg` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`whitespace-nowrap border px-2 py-1 text-xs ${COLOR[b.estado] ?? "text-texto-sec"}`}>
                      {b.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {b.estado !== "abierta" && (
                        <Accion id={b.id} estado="abierta" label="Publicar" tono="exito" />
                      )}
                      {b.estado !== "rechazada" && (
                        <Accion id={b.id} estado="rechazada" label="Rechazar" tono="error" />
                      )}
                      {b.estado === "abierta" && (
                        <Accion id={b.id} estado="cerrada" label="Cerrar" tono="neutro" />
                      )}
                    </div>
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

function Accion({
  id,
  estado,
  label,
  tono,
}: {
  id: string;
  estado: string;
  label: string;
  tono: "exito" | "error" | "neutro";
}) {
  const clase =
    tono === "exito"
      ? "hover:border-exito hover:text-exito"
      : tono === "error"
        ? "hover:border-error hover:text-error"
        : "hover:border-texto hover:text-texto";
  return (
    <form action={setEstadoBusqueda}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button className={`border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors ${clase}`}>
        {label}
      </button>
    </form>
  );
}

function Chip({ activo, href, label }: { activo: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`border px-3.5 py-1.5 text-xs transition-colors ${
        activo
          ? "border-primario bg-primario/10 text-texto"
          : "border-borde text-texto-sec hover:border-texto/40 hover:text-texto"
      }`}
    >
      {label}
    </Link>
  );
}
