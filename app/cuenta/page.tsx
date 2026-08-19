import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setAvisos } from "./actions";
import { fotoPerfil } from "@/lib/ficha";
import { supabase as supabaseAnon } from "@/lib/supabase";
import SolicitudCard, { type SolicitudPublica } from "@/components/SolicitudCard";

export const metadata: Metadata = {
  title: "Mi cuenta | DeCarnes",
  robots: { index: false, follow: false },
};

type Estado = {
  verificado: boolean;
  rol_mercado: string | null;
  empresa: string | null;
  foto_path: string | null;
  descripcion: string | null;
  provincia: string | null;
  whatsapp: string | null;
  perfil_completo: boolean;
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: est } = await supabase.rpc("mi_estado_cuenta");
  const e = (Array.isArray(est) ? est[0] : null) as Estado | null;

  // El comprador no tiene escritorio propio: su lugar es el catálogo.
  if (e?.rol_mercado === "compra") redirect("/mercado");

  const { data: u } = await supabase
    .from("usuarios")
    .select("recibir_avisos")
    .eq("id", user!.id)
    .maybeSingle();
  const recibeAvisos = u?.recibir_avisos ?? true;

  const nombre = e?.empresa ?? "";
  const foto = fotoPerfil(e?.foto_path ?? null);

  // Su stock de un vistazo (RLS limita a los lotes propios).
  const { data: lotes } = await supabase
    .from("lotes")
    .select("id, publico, vendido")
    .not("user_id", "is", null);
  const total = lotes?.length ?? 0;
  const publicados = lotes?.filter((l) => l.publico && !l.vendido).length ?? 0;
  const vendidos = lotes?.filter((l) => l.vendido).length ?? 0;

  // Demanda activa: el motivo más concreto para que vuelva a entrar.
  const { data: solsRaw } = await supabaseAnon.rpc("solicitudes_publicas", { p_limite: 3 });
  const { data: totalSols } = await supabaseAnon.rpc("solicitudes_abiertas_count");
  const solicitudes = (solsRaw ?? []) as SolicitudPublica[];
  const nSols = Number(totalSols ?? solicitudes.length);

  // Lo que le falta para que su perfil público esté listo.
  const pasos = [
    { hecho: Boolean(e?.empresa), label: "Nombre de tu frigorífico" },
    { hecho: Boolean(e?.provincia), label: "Dónde estás ubicado" },
    { hecho: Boolean(e?.whatsapp), label: "WhatsApp de contacto" },
    { hecho: Boolean(e?.foto_path), label: "Foto de perfil" },
    { hecho: Boolean(e?.descripcion), label: "Descripción de tu frigorífico" },
  ];
  const faltan = pasos.filter((p) => !p.hecho).length;

  return (
    <div>
      {ok === "empresa" && (
        <p className="mb-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Datos guardados.
        </p>
      )}
      {ok === "avisos" && (
        <p className="mb-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Preferencia de avisos actualizada.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primario-suave font-serif text-xl text-primario">
          {foto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={foto} alt="" className="h-full w-full object-cover" />
          ) : (
            (nombre || "?").charAt(0).toUpperCase()
          )}
        </span>
        <div>
          <h1 className="font-serif text-3xl font-medium text-texto sm:text-4xl">
            Hola{nombre ? `, ${nombre}` : ""}.
          </h1>
          <p className={`mt-1 text-sm ${e?.verificado ? "text-exito" : "text-texto-sec"}`}>
            {e?.verificado ? "Frigorífico verificado" : "Cuenta en verificación"}
          </p>
        </div>
      </div>

      {/* Onboarding: mientras falte algo del perfil público, es lo primero que ve */}
      {faltan > 0 && (
        <div className="mt-8 border border-acento bg-acento/10 p-6 sm:p-7">
          <p className="font-serif text-xl font-medium text-texto">Completá tu perfil</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto">
            Los compradores ven tu nombre, tu foto y tu descripción en cada lote que
            publicás. Un perfil completo es lo que hace que te consulten a vos.
          </p>
          <ul className="mt-5 space-y-2">
            {pasos.map((p) => (
              <li key={p.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    p.hecho ? "bg-exito text-superficie" : "border border-texto/30"
                  }`}
                >
                  {p.hecho ? "✓" : ""}
                </span>
                <span className={p.hecho ? "text-texto/50 line-through" : "text-texto"}>
                  {p.label}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/cuenta/empresa"
            className="mt-6 inline-block bg-tinta px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-tinta-hover"
          >
            Completar mi perfil
          </Link>
        </div>
      )}

      {total > 0 && (
        <dl className="mt-10 grid grid-cols-3 gap-4 border-y border-borde py-6">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">En venta</dt>
            <dd className="mt-1 font-serif text-3xl text-texto">{publicados}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Vendidos</dt>
            <dd className="mt-1 font-serif text-3xl text-texto">{vendidos}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Total</dt>
            <dd className="mt-1 font-serif text-3xl text-texto">{total}</dd>
          </div>
        </dl>
      )}

      {solicitudes.length > 0 && (
        <section className="mt-10 border border-borde bg-superficie p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Oportunidades</p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-texto">
                {nSols === 1
                  ? "Un comprador está buscando mercadería"
                  : `${nSols} compradores están buscando mercadería`}
              </h2>
            </div>
            <Link
              href="/cuenta/busquedas"
              className="text-sm font-medium text-primario underline-offset-4 transition-colors hover:underline"
            >
              Ver todas las solicitudes →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {solicitudes.map((sol) => (
              <SolicitudCard key={sol.id} s={sol} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Acceso href="/cuenta/publicar" titulo="Publicar lote" texto="Cargá un lote con fotos y especificaciones." />
        <Acceso href="/cuenta/mis-lotes" titulo="Mis lotes" texto="Pausá, editá o marcá como vendido." />
        <Acceso href="/cuenta/busquedas" titulo="Solicitudes de compra" texto="Lo que buscan los compradores. Cotizá y ganá la operación." />
      </div>

      {/* Preferencia de avisos por email */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-borde bg-superficie p-6">
        <div>
          <p className="font-medium text-texto">Avisos de lotes nuevos</p>
          <p className="mt-1 text-sm text-texto-sec">
            {recibeAvisos
              ? "Te llega un email cuando se publica un lote nuevo en el mercado."
              : "No estás recibiendo avisos de lotes nuevos."}
          </p>
        </div>
        <form action={setAvisos}>
          <input type="hidden" name="recibir" value={recibeAvisos ? "false" : "true"} />
          <button
            className={
              recibeAvisos
                ? "whitespace-nowrap border border-borde px-5 py-2.5 text-sm text-texto-sec transition-colors hover:border-error hover:text-error"
                : "whitespace-nowrap border border-exito/40 px-5 py-2.5 text-sm text-exito transition-colors hover:bg-exito/10"
            }
          >
            {recibeAvisos ? "Desactivar avisos" : "Activar avisos"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Acceso({ href, titulo, texto }: { href: string; titulo: string; texto: string }) {
  return (
    <Link
      href={href}
      className="group border border-borde bg-superficie p-6 transition-colors hover:border-primario"
    >
      <p className="font-serif text-xl font-medium text-texto transition-colors group-hover:text-primario">
        {titulo}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-sec">{texto}</p>
    </Link>
  );
}
