import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setEstadoSolicitud } from "../../actions";
import { rolLabel } from "@/lib/beta";
import { formatFecha } from "@/lib/panel";

type Solicitud = {
  id: string;
  created_at: string;
  nombre_contacto: string | null;
  empresa: string | null;
  cuit: string | null;
  rol: string | null;
  contacto: string | null;
  notas: string | null;
  estado: string | null;
  invitacion_token: string | null;
  invitacion_usada: boolean | null;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trading-mbeef.vercel.app";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
];

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "border-salmon/50 text-salmon",
  aprobada: "border-verde-claro/50 text-verde-claro",
  rechazada: "border-hueso/20 text-taupe",
};

/** Devuelve un enlace de contacto (WhatsApp si parece número, mailto si es email). */
function contactoHref(contacto: string | null): { href: string; tipo: "wa" | "mail" } | null {
  if (!contacto) return null;
  const digitos = contacto.replace(/\D/g, "");
  if (digitos.length >= 8 && !contacto.includes("@")) {
    return { href: `https://wa.me/${digitos}`, tipo: "wa" };
  }
  if (contacto.includes("@")) {
    return { href: `mailto:${contacto.trim()}`, tipo: "mail" };
  }
  return null;
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createSupabaseServer();

  let query = supabase
    .from("solicitudes_beta")
    .select("*")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  const solicitudes = (data ?? []) as Solicitud[];

  const { count: pendientes } = await supabase
    .from("solicitudes_beta")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-hueso">Solicitudes de beta</h1>
          <p className="mt-1 text-sm text-taupe">
            <span className="text-hueso">{pendientes ?? 0}</span> pendiente
            {pendientes === 1 ? "" : "s"} de aprobación
          </p>
        </div>
      </div>

      {/* Filtro por estado */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip activo={!estado} href="/panel/solicitudes" label="Todas" />
        {ESTADOS.map((e) => (
          <Chip key={e.value} activo={estado === e.value} href={`/panel/solicitudes?estado=${e.value}`} label={e.label} />
        ))}
      </div>

      {error && (
        <p className="mt-8 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{error.message}</p>
      )}

      {solicitudes.length === 0 ? (
        <p className="mt-12 text-sm text-taupe">No hay solicitudes para mostrar.</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-hueso/10">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-hueso/10 text-left text-[11px] uppercase tracking-[0.16em] text-taupe">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Empresa</th>
                <th className="px-4 py-3 font-normal">Nombre</th>
                <th className="px-4 py-3 font-normal">CUIT</th>
                <th className="px-4 py-3 font-normal">Rol</th>
                <th className="px-4 py-3 font-normal">Contacto</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => {
                const c = contactoHref(s.contacto);
                return (
                  <tr key={s.id} className="border-b border-hueso/5 align-top">
                    <td className="px-4 py-3 text-taupe">{formatFecha(s.created_at)}</td>
                    <td className="px-4 py-3 text-hueso">{s.empresa ?? "—"}</td>
                    <td className="px-4 py-3 text-taupe">{s.nombre_contacto ?? "—"}</td>
                    <td className="px-4 py-3 text-taupe">{s.cuit ?? "—"}</td>
                    <td className="px-4 py-3 text-taupe">{rolLabel(s.rol)}</td>
                    <td className="px-4 py-3">
                      {c ? (
                        <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-rojo-claro hover:text-hueso">
                          {c.tipo === "wa" ? "WhatsApp" : "Email"}
                          <span className="text-taupe">· {s.contacto}</span>
                        </a>
                      ) : (
                        <span className="text-taupe">{s.contacto ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap border px-2 py-1 text-xs ${ESTADO_COLOR[s.estado ?? "pendiente"] ?? "text-taupe"}`}>
                        {ESTADOS.find((e) => e.value === s.estado)?.label ?? s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {c?.tipo === "wa" && (
                          <a href={c.href} target="_blank" rel="noopener noreferrer" className="border border-verde-claro/40 px-3 py-1.5 text-xs text-verde-claro transition-colors hover:bg-verde/20">
                            Avisar por WhatsApp
                          </a>
                        )}
                        {s.estado !== "aprobada" && (
                          <form action={setEstadoSolicitud}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="estado" value="aprobada" />
                            <button className="border border-hueso/25 px-3 py-1.5 text-xs text-hueso transition-colors hover:border-verde-claro hover:text-verde-claro">
                              Aprobar
                            </button>
                          </form>
                        )}
                        {s.estado !== "rechazada" && (
                          <form action={setEstadoSolicitud}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="estado" value="rechazada" />
                            <button className="border border-hueso/25 px-3 py-1.5 text-xs text-taupe transition-colors hover:border-rojo hover:text-rojo-claro">
                              Rechazar
                            </button>
                          </form>
                        )}
                      </div>
                      {s.estado === "aprobada" && s.invitacion_token && (
                        <p className="mt-2 max-w-[44ch] text-xs">
                          {s.invitacion_usada ? (
                            <span className="text-taupe/60">Invitación ya usada (cuenta creada).</span>
                          ) : (
                            <>
                              <span className="block text-[10px] uppercase tracking-[0.18em] text-taupe/60">
                                Enlace de invitación (mandar por WhatsApp):
                              </span>
                              <span className="block break-all text-salmon">
                                {SITE_URL}/registro?token={s.invitacion_token}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                      {s.notas && <p className="mt-2 max-w-[40ch] text-xs text-taupe/70">{s.notas}</p>}
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

function Chip({ activo, href, label }: { activo: boolean; href: string; label: string }) {
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
