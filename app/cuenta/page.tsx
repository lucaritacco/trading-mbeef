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
        <p className="mb-6 border border-verde-claro/40 bg-verde/15 px-4 py-3 text-sm text-verde-claro">
          Datos de empresa guardados.
        </p>
      )}
      {ok === "avisos" && (
        <p className="mb-6 border border-verde-claro/40 bg-verde/15 px-4 py-3 text-sm text-verde-claro">
          Preferencia de avisos actualizada.
        </p>
      )}

      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mi cuenta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Hola{nombre ? `, ${nombre}` : ""}.
      </h1>

      {!perfilOk && (
        <div className="mt-8 border border-salmon/40 bg-salmon/10 p-6">
          <p className="font-medium text-hueso">Completá los datos de tu empresa</p>
          <p className="mt-1 text-sm text-taupe">
            Necesitamos tu WhatsApp y datos de empresa para que los compradores
            puedan contactarte por tus lotes.
          </p>
          <Link
            href="/cuenta/empresa"
            className="mt-4 inline-block bg-bordo px-5 py-2.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo"
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
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-hueso/15 p-6">
        <div>
          <p className="font-medium text-hueso">Avisos de lotes nuevos</p>
          <p className="mt-1 text-sm text-taupe">
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
                ? "whitespace-nowrap border border-hueso/25 px-5 py-2.5 text-sm text-taupe transition-colors hover:border-rojo hover:text-rojo-claro"
                : "whitespace-nowrap border border-verde-claro/50 px-5 py-2.5 text-sm text-verde-claro transition-colors hover:bg-verde/20"
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
      className="group border border-hueso/15 p-6 transition-colors hover:border-bordo"
    >
      <p className="font-serif text-xl font-medium text-hueso transition-colors group-hover:text-rojo-claro">
        {titulo}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-taupe">{texto}</p>
    </Link>
  );
}
