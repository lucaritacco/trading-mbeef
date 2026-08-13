import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { crearComprador } from "../../actions";
import CompradorFields from "@/components/panel/CompradorFields";
import { formatARS, type Comprador } from "@/lib/panel";
import { inputBase } from "@/lib/ui";

export default async function CompradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const { q, ok, error } = await searchParams;
  const supabase = await createSupabaseServer();

  let query = supabase
    .from("compradores")
    .select("*")
    .order("created_at", { ascending: false });
  if (q && q.trim()) {
    const t = q.trim();
    query = query.or(`nombre.ilike.%${t}%,cortes_busca.ilike.%${t}%,notas.ilike.%${t}%`);
  }
  const { data, error: errLectura } = await query;
  const compradores = (data ?? []) as Comprador[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-texto">Compradores</h1>
          <p className="mt-1 text-sm text-texto-sec">Registro de demanda para matching manual con lotes.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q ?? ""} placeholder="Buscar nombre, corte o nota" className={`${inputBase} w-64`} />
          <button className="border border-borde px-4 py-3 text-sm text-texto transition-colors hover:border-borde">Buscar</button>
        </form>
      </div>

      {ok && <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">Comprador {ok}.</p>}
      {error && error !== "nombre" && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{error}</p>
      )}

      {errLectura ? (
        <p className="mt-8 border border-primario/40 bg-primario/10 px-4 py-3 text-sm text-primario">
          No se pudo leer la tabla de compradores. ¿Corriste la migración
          0006_compradores.sql? (ver NOCHE.md)
        </p>
      ) : compradores.length === 0 ? (
        <p className="mt-10 text-sm text-texto-sec">No hay compradores cargados{q ? " para esa búsqueda" : ""}.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-borde">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                <th className="px-4 py-3 font-normal">Nombre</th>
                <th className="px-4 py-3 font-normal">Busca</th>
                <th className="px-4 py-3 font-normal">Volúmenes</th>
                <th className="px-4 py-3 font-normal">Precio máx.</th>
                <th className="px-4 py-3 font-normal">Plazo</th>
                <th className="px-4 py-3 font-normal">Crédito</th>
              </tr>
            </thead>
            <tbody>
              {compradores.map((c) => (
                <tr key={c.id} className="group border-b border-borde transition-colors hover:bg-fondo/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/panel/compradores/${c.id}`} className="text-texto group-hover:text-primario">
                      {c.nombre}
                    </Link>
                    <span className="block text-xs text-texto-sec">{c.contacto}</span>
                  </td>
                  <td className="px-4 py-3 text-texto-sec">{c.cortes_busca ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{c.volumenes ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{formatARS(c.precio_max)}</td>
                  <td className="px-4 py-3 text-texto-sec">{c.plazo_habitual ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-sec">{formatARS(c.linea_credito)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alta de comprador */}
      <div className="mt-12 border border-borde p-6">
        <h2 className="mb-5 font-serif text-xl font-medium text-texto">Nuevo comprador</h2>
        <form action={crearComprador} className="space-y-5">
          <CompradorFields />
          <button type="submit" className="bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover">
            Agregar comprador
          </button>
        </form>
      </div>
    </div>
  );
}
