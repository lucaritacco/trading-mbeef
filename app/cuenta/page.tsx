import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

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
    .select("empresa, nombre_fantasia, razon_social, perfil_completo, whatsapp")
    .eq("id", user!.id)
    .maybeSingle();

  const nombre = u?.nombre_fantasia || u?.razon_social || u?.empresa || "";
  const perfilOk = u?.perfil_completo && u?.whatsapp;

  return (
    <div>
      {ok === "empresa" && (
        <p className="mb-6 border border-verde-claro/40 bg-verde/15 px-4 py-3 text-sm text-verde-claro">
          Datos de empresa guardados.
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
