import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { setAvisos } from "./actions";

export const metadata: Metadata = {
  title: "Mi cuenta | DeCarnes",
  robots: { index: false, follow: false },
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
  const { data: u } = await supabase
    .from("usuarios")
    .select("empresa, nombre_fantasia, razon_social, perfil_completo, whatsapp, recibir_avisos")
    .eq("id", user!.id)
    .maybeSingle();
  const recibeAvisos = u?.recibir_avisos ?? true;

  const nombre = u?.nombre_fantasia || u?.razon_social || u?.empresa || "";
  const perfilOk = u?.perfil_completo && u?.whatsapp;

  return (
    <div>
      {ok === "empresa" && (
        <p className="mb-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Datos de empresa guardados.
        </p>
      )}
      {ok === "avisos" && (
        <p className="mb-6 border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito">
          Preferencia de avisos actualizada.
        </p>
      )}

      <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Mi cuenta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">
        Hola{nombre ? `, ${nombre}` : ""}.
      </h1>

      {!perfilOk && (
        <div className="mt-8 border border-primario/40 bg-primario/10 p-6">
          <p className="font-medium text-texto">Completá los datos de tu empresa</p>
          <p className="mt-1 text-sm text-texto-sec">
            Necesitamos tu WhatsApp y datos de empresa para que los compradores
            puedan contactarte por tus lotes.
          </p>
          <Link
            href="/cuenta/empresa"
            className="mt-4 inline-block bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
          >
            Completar mi empresa
          </Link>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Acceso href="/cuenta/publicar" titulo="Publicar lote" texto="Cargá un lote con fotos y especificaciones." />
        <Acceso href="/cuenta/mercado" titulo="Mercado" texto="Mirá los lotes publicados por todo el país." />
        <Acceso href="/cuenta/mis-lotes" titulo="Mis lotes" texto="Gestioná, despublicá o editá tus lotes." />
      </div>

      {/* Preferencia de avisos por email */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-borde p-6">
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
                ? "whitespace-nowrap border border-borde px-5 py-2.5 text-sm text-texto-sec transition-colors hover:border-error hover:text-primario"
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
      className="group border border-borde p-6 transition-colors hover:border-primario"
    >
      <p className="font-serif text-xl font-medium text-texto transition-colors group-hover:text-primario">
        {titulo}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-sec">{texto}</p>
    </Link>
  );
}
