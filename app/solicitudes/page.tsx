import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/home/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SolicitudCard, { type SolicitudPublica } from "@/components/SolicitudCard";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { absoluta, jsonLdBreadcrumbs, jsonLdProps } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Solicitudes de compra | DeCarnes",
  description:
    "Compradores mayoristas están buscando mercadería en DeCarnes. Mirá la demanda activa y cotizá como frigorífico.",
  alternates: { canonical: "/solicitudes" },
  openGraph: {
    title: "Solicitudes de compra | DeCarnes",
    description: "Demanda mayorista activa: qué están buscando los compradores.",
    url: absoluta("/solicitudes"),
  },
};

export default async function SolicitudesPage() {
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  // Pública y anónima: la misma fuente que la home, con más cantidad.
  const [{ data }, { data: total }] = await Promise.all([
    supabase.rpc("solicitudes_publicas", { p_limite: 60 }),
    supabase.rpc("solicitudes_abiertas_count"),
  ]);
  const solicitudes = (data ?? []) as SolicitudPublica[];
  const n = Number(total ?? solicitudes.length);

  const publicar = logueado ? "/cuenta/busquedas/nueva" : "/registro?next=/cuenta/busquedas/nueva";

  return (
    <>
      <script
        {...jsonLdProps(
          jsonLdBreadcrumbs([
            { nombre: "Inicio", path: "/" },
            { nombre: "Solicitudes de compra", path: "/solicitudes" },
          ]),
        )}
      />
      <TopBar />
      <Header logueado={logueado} />
      <main className="min-h-svh">
        <section className="border-b border-borde bg-fondo">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-primario">
              <span className="h-px w-6 bg-primario" aria-hidden="true" />
              Demanda
            </p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="font-serif text-[clamp(2rem,4.6vw,3.2rem)] font-medium leading-tight text-texto">
                  Solicitudes de compra
                </h1>
                <p className="mt-3 max-w-xl leading-relaxed text-texto-sec">
                  Compradores mayoristas están buscando mercadería en DeCarnes.
                </p>
                {n > 0 && (
                  <p className="mt-4 font-serif text-xl text-texto">
                    {n} solicitud{n === 1 ? "" : "es"} activa{n === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <Link
                href={publicar}
                className="bg-primario px-6 py-3.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
              >
                Publicar solicitud
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-superficie">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            {solicitudes.length === 0 ? (
              <div className="border border-dashed border-borde px-6 py-16 text-center">
                <p className="font-serif text-xl text-texto">
                  Todavía no hay solicitudes activas
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-texto-sec">
                  Si necesitás mercadería, publicá lo que buscás y los frigoríficos
                  registrados te cotizan.
                </p>
                <Link
                  href={publicar}
                  className="mt-6 inline-block bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
                >
                  Publicar la primera
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {solicitudes.map((s) => (
                  <SolicitudCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cierre para el frigorífico: es a quien más le sirve esta página */}
        <section className="border-t border-borde bg-fondo">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-serif text-2xl font-medium text-texto">
                ¿Tenés esta mercadería?
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-texto-sec">
                Para cotizar necesitás una cuenta de frigorífico verificada. Publicás tu
                stock y respondés las solicitudes que te sirven.
              </p>
            </div>
            <Link
              href={logueado ? "/cuenta/busquedas" : "/vendedores"}
              className="shrink-0 self-start bg-tinta px-6 py-3.5 text-sm font-medium text-superficie transition-colors hover:bg-tinta-hover md:self-auto"
            >
              {logueado ? "Cotizar solicitudes" : "Registrar mi frigorífico"}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
