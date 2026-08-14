import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopBar from "@/components/home/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoteCard from "@/components/LoteCard";
import { getPerfilVendedor, getLotesVendedor, firmarFoto, fotoPerfil } from "@/lib/ficha";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getPerfilVendedor(id);
  if (!p) return { title: "Frigorífico no disponible — DeCarnes", robots: { index: false } };
  const titulo = `${p.nombre} — Lotes en DeCarnes`;
  const desc =
    p.descripcion?.slice(0, 180) ||
    `Lotes publicados por ${p.nombre}${p.provincia ? ` en ${p.provincia}` : ""}.`;
  return {
    title: titulo,
    description: desc,
    alternates: { canonical: `${SITE_URL}/vendedor/${id}` },
    openGraph: { title: titulo, description: desc, url: `${SITE_URL}/vendedor/${id}` },
  };
}

export default async function VendedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await getPerfilVendedor(id);
  if (!perfil) notFound();

  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  const lotes = await getLotesVendedor(id);
  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  const avatar = fotoPerfil(perfil.foto_path);

  return (
    <>
      <TopBar />
      <Header />
      <main className="min-h-svh">
        <section className="border-b border-borde bg-fondo">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primario-suave font-serif text-3xl text-primario">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (perfil.nombre ?? "?").charAt(0)
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-medium text-texto sm:text-4xl">
                  {perfil.nombre}
                </h1>
                {perfil.verificado && (
                  <span className="flex items-center gap-1.5 border border-exito/50 px-2.5 py-1 text-xs text-exito">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M12 1.5l2.6 2 3.2-.3 1 3.1 2.7 1.8-1.3 3 1.3 3-2.7 1.8-1 3.1-3.2-.3-2.6 2-2.6-2-3.2.3-1-3.1L2.5 15l1.3-3-1.3-3 2.7-1.8 1-3.1 3.2.3zM10.9 15.4l5.3-5.3-1.4-1.4-3.9 3.9-1.8-1.8-1.4 1.4z" />
                    </svg>
                    Frigorífico verificado
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-texto-sec">
                {[perfil.provincia, `${perfil.cant_lotes ?? 0} lote${perfil.cant_lotes === 1 ? "" : "s"} publicado${perfil.cant_lotes === 1 ? "" : "s"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {perfil.descripcion && (
                <p className="mt-4 max-w-2xl leading-relaxed text-texto-sec">{perfil.descripcion}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-superficie">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <h2 className="font-serif text-2xl font-medium text-texto">Lotes publicados</h2>
            {lotes.length === 0 ? (
              <p className="mt-6 text-sm text-texto-sec">
                Este frigorífico no tiene lotes publicados en este momento.
              </p>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lotes.map((l) => (
                  <LoteCard
                    key={l.id}
                    l={l}
                    foto={fotos.get(l.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
