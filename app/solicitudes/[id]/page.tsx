import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/home/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompartirWhatsapp from "@/components/CompartirWhatsapp";
import RegistrarEvento from "@/components/RegistrarEvento";
import { haceCuanto, type SolicitudPublica } from "@/components/SolicitudCard";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SITE_URL, jsonLdBreadcrumbs, jsonLdProps } from "@/lib/seo";

const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

async function getSolicitud(id: string): Promise<SolicitudPublica | null> {
  const { data } = await supabase.rpc("solicitud_publica", { p_id: id });
  const fila = Array.isArray(data) ? data[0] : null;
  return (fila as SolicitudPublica) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getSolicitud(id);
  if (!s) return { title: "Solicitud no disponible — DeCarnes", robots: { index: false } };

  const titulo = `Buscan ${s.tipo_corte ?? "carne"}${
    s.cantidad_kg ? ` · ${kg.format(s.cantidad_kg)} kg` : ""
  }${s.provincia ? ` · ${s.provincia}` : ""} — DeCarnes`;
  return {
    title: titulo,
    description: `Un comprador mayorista busca ${s.tipo_corte ?? "mercadería"} en DeCarnes. Cotizá como frigorífico.`,
    alternates: { canonical: `${SITE_URL}/solicitudes/${id}` },
    openGraph: { title: titulo, url: `${SITE_URL}/solicitudes/${id}` },
  };
}

export default async function SolicitudPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSolicitud(id);
  if (!s) notFound();

  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  // Con sesión, cotizar se hace en el detalle interno, que ya tiene el formulario
  // y el aislamiento de ofertas. Sin sesión, al login conservando la intención.
  const destinoCotizar = logueado
    ? `/cuenta/busquedas/${s.id}`
    : `/login?next=${encodeURIComponent(`/cuenta/busquedas/${s.id}`)}`;

  const ofertas = Number(s.ofertas_count ?? 0);
  const url = `${SITE_URL}/solicitudes/${s.id}`;

  const datos = [
    { label: "Corte / artículo", valor: s.tipo_corte },
    { label: "Especie / categoría", valor: s.especie_categoria },
    { label: "Cantidad", valor: s.cantidad_kg != null ? `${kg.format(s.cantidad_kg)} kg` : null },
    { label: "Zona", valor: s.provincia },
    { label: "Plazo", valor: s.plazo_necesario },
  ];

  return (
    <>
      <script
        {...jsonLdProps(
          jsonLdBreadcrumbs([
            { nombre: "Inicio", path: "/" },
            { nombre: "Solicitudes de compra", path: "/solicitudes" },
            { nombre: s.tipo_corte ?? "Solicitud", path: `/solicitudes/${s.id}` },
          ]),
        )}
      />
      <RegistrarEvento tipo="request_view" busquedaId={s.id} />
      <TopBar />
      <Header logueado={logueado} />

      <main className="min-h-svh bg-superficie">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <Link
            href="/solicitudes"
            className="text-sm text-texto-sec transition-colors hover:text-texto"
          >
            ← Solicitudes
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="bg-tinta px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-superficie">
              Busco
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-exito">
              <span className="h-1.5 w-1.5 rounded-full bg-exito" aria-hidden="true" />
              Activa
            </span>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-medium leading-tight text-texto sm:text-4xl">
            {s.tipo_corte ?? "Solicitud de compra"}
          </h1>
          <p className="mt-2 text-texto-sec">
            {[s.especie_categoria, s.cantidad_kg != null ? `${kg.format(s.cantidad_kg)} kg` : null, s.provincia]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-sm text-texto-sec">
            Publicada {haceCuanto(s.created_at)}
            {ofertas > 0 && ` · ${ofertas} cotizacion${ofertas === 1 ? "" : "es"} recibida${ofertas === 1 ? "" : "s"}`}
          </p>

          <div className="mt-10 grid gap-10 border-t border-borde pt-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.24em] text-texto-sec">
                Qué está buscando
              </h2>
              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                {datos.map((d) => (
                  <div key={d.label}>
                    <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">
                      {d.label}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {d.valor ? (
                        <span className="text-texto">{d.valor}</span>
                      ) : (
                        <span className="italic text-texto-sec">A definir</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 border-t border-borde pt-6 text-xs leading-relaxed text-texto-sec">
                Los datos del comprador no se publican. Se habilitan cuando acepta una
                cotización.
              </p>
            </div>

            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="border border-borde bg-fondo p-6">
                <p className="font-serif text-xl font-medium text-texto">Cotizá esta solicitud</p>
                {logueado ? (
                  <p className="mt-1 text-sm text-texto-sec">
                    Enviá tu precio por kg, cantidad y plazo. El comprador compara y elige.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-texto-sec">
                    Para responder solicitudes necesitás ingresar con una cuenta de
                    frigorífico.
                  </p>
                )}
                <Link
                  href={destinoCotizar}
                  className="mt-5 flex w-full items-center justify-center bg-primario px-6 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover"
                >
                  {logueado ? "Cotizar solicitud" : "Ingresar y cotizar"}
                </Link>
                {!logueado && (
                  <p className="mt-3 text-center text-sm text-texto-sec">
                    ¿No tenés cuenta?{" "}
                    <Link href="/vendedores" className="text-primario underline-offset-4 hover:underline">
                      Registrar frigorífico
                    </Link>
                  </p>
                )}
              </div>

              <div className="mt-3">
                <CompartirWhatsapp
                  texto={`Buscan ${s.tipo_corte ?? "carne"}${s.cantidad_kg ? ` — ${kg.format(s.cantidad_kg)} kg` : ""}${s.provincia ? ` — ${s.provincia}` : ""} en DeCarnes:`}
                  url={url}
                  full
                  label="Compartir solicitud"
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
