import { createSupabaseServer } from "@/lib/supabase/server";
import { setVerificado } from "../../actions";
import { formatFecha } from "@/lib/panel";
import { rolLabel } from "@/lib/beta";

type Usuario = {
  id: string;
  created_at: string;
  empresa: string | null;
  cuit: string | null;
  rol_mercado: string | null;
  estado: string;
  verificado: boolean;
  verificado_at: string | null;
};

export default async function FrigorificosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, created_at, empresa, cuit, rol_mercado, estado, verificado, verificado_at")
    .order("created_at", { ascending: false });
  const usuarios = (data ?? []) as Usuario[];

  const pendientes = usuarios.filter((u) => !u.verificado && u.rol_mercado !== "compra");

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-texto">Cuentas</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto-sec">
        La verificación es lo que habilita a publicar: un frigorífico sin verificar no
        puede cargar lotes, y sus lotes no muestran el sello.{" "}
        {pendientes.length > 0 && (
          <span className="text-texto">
            {pendientes.length} sin verificar.
          </span>
        )}
      </p>

      {ok && (
        <p className="mt-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Verificación actualizada.
        </p>
      )}
      {error && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">
          {error.message}
        </p>
      )}

      {usuarios.length === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">Todavía no hay cuentas creadas.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-borde">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                <th className="px-4 py-3 font-normal">Alta</th>
                <th className="px-4 py-3 font-normal">Empresa</th>
                <th className="px-4 py-3 font-normal">CUIT</th>
                <th className="px-4 py-3 font-normal">Rol</th>
                <th className="px-4 py-3 font-normal">Verificado</th>
                <th className="px-4 py-3 font-normal">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esComprador = u.rol_mercado === "compra";
                return (
                  <tr key={u.id} className="border-b border-borde/60">
                    <td className="px-4 py-3 text-texto-sec">{formatFecha(u.created_at)}</td>
                    <td className="px-4 py-3 text-texto">{u.empresa ?? "—"}</td>
                    <td className="px-4 py-3 text-texto-sec">{u.cuit ?? "—"}</td>
                    <td className="px-4 py-3 text-texto-sec">{rolLabel(u.rol_mercado)}</td>
                    <td className="px-4 py-3">
                      {u.verificado ? (
                        <span className="whitespace-nowrap border border-exito/50 px-2 py-1 text-xs text-exito">
                          Verificado {u.verificado_at ? `· ${formatFecha(u.verificado_at)}` : ""}
                        </span>
                      ) : (
                        <span className="whitespace-nowrap border border-borde px-2 py-1 text-xs text-texto-sec">
                          Sin verificar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {esComprador ? (
                        <span className="text-xs text-texto-sec">Comprador (no publica)</span>
                      ) : (
                        <form action={setVerificado}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="verificado" value={u.verificado ? "false" : "true"} />
                          {u.verificado ? (
                            <button className="border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors hover:border-error hover:text-error">
                              Quitar verificación
                            </button>
                          ) : (
                            <button className="border border-borde px-3 py-1.5 text-xs text-texto transition-colors hover:border-exito hover:text-exito">
                              Verificar
                            </button>
                          )}
                        </form>
                      )}
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
