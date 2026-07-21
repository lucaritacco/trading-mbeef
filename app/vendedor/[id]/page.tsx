import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import LoteCard from "@/components/LoteCard";
import CompartirWhatsapp from "@/components/CompartirWhatsapp";
import { getPerfilVendedor, getLotesVendedor, firmarFoto } from "@/lib/ficha";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://decarnesonline.com";

function resumen(cant: number | null, provincia: string | null, localidad: string | null): string {
  const n = cant ?? 0;
  const ubic = [localidad, provincia].filter(Boolean).join(", ");
  return `${n} lote${n === 1 ? "" : "s"} publicado${n === 1 ? "" : "s"}${ubic ? ` · ${ubic}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const perfil = await getPerfilVendedor(id);
  if (!perfil) return { title: "Vendedor no disponible — DeCarnes", robots: { index: false } };

  const lotes = await getLotesVendedor(id);
  const ogPath = lotes.find((l) => l.foto_principal)?.foto_principal ?? null;
  const ogUrl = ogPath ? await firmarFoto(ogPath) : null;
  const titulo = `Lotes de ${perfil.nombre} — DeCarnes`;
  const desc = resumen(perfil.cant_lotes, perfil.provincia, perfil.localidad);

  return {
    title: titulo,
    description: desc,
    alternates: { canonical: `${SITE}/vendedor/${id}` },
    openGraph: {
      title: titulo,
      description: desc,
      url: `${SITE}/vendedor/${id}`,
      type: "website",
      images: ogUrl ? [{ url: ogUrl }] : [],
    },
    twitter: { card: ogUrl ? "summary_large_image" : "summary", title: titulo, description: desc },
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

  const lotes = await getLotesVendedor(id);

  const fotos = new Map<string, string>();
  await Promise.all(
    lotes.map(async (l) => {
      if (!l.foto_principal) return;
      const url = await firmarFoto(l.foto_principal);
      if (url) fotos.set(l.id, url);
    }),
  );

  const ubicacion = [perfil.localidad, perfil.provincia].filter(Boolean).join(", ");
  const compartirTexto = `Mirá los lotes de ${perfil.nombre} en DeCarnes:`;

  return (
    <>
      <Header />
      <main className="min-h-svh">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Vendedor en DeCarnes</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-medium text-hueso sm:text-5xl">
                {perfil.nombre}
              </h1>
              <p className="mt-2 text-taupe">
                {resumen(perfil.cant_lotes, perfil.provincia, perfil.localidad)}
              </p>
            </div>
            <CompartirWhatsapp texto={compartirTexto} url={`${SITE}/vendedor/${id}`} />
          </div>

          {lotes.length === 0 ? (
            <p className="mt-12 text-sm text-taupe">
              Este vendedor no tiene lotes publicados en este momento.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lotes.map((l) => (
                <LoteCard key={l.id} l={l} foto={fotos.get(l.id)} />
              ))}
            </div>
          )}

          <p className="mt-12 text-xs text-taupe/60">
            {ubicacion && <>Ubicación: {ubicacion}. </>}
            Publicaciones de DeCarnes, la mesa de compras de MBEEF.
          </p>
        </div>
      </main>
    </>
  );
}
