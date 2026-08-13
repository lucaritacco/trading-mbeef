import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/home/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RespaldoMbeef from "@/components/RespaldoMbeef";
import { createSupabaseServer } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/vendedores" },
  title: "Publicá tu stock | DeCarnes",
  description:
    "Sumate como frigorífico fundador de DeCarnes: publicá tus lotes y llegá a compradores de todo el país. Beta con cupos limitados y tarifas preferenciales.",
};

const PASOS = [
  {
    n: "1",
    title: "Registrás tu empresa",
    body: "Nos dejás los datos de tu frigorífico y tu habilitación sanitaria.",
  },
  {
    n: "2",
    title: "Completás la verificación",
    body: "Hablamos con vos y revisamos la documentación. Es lo que habilita a publicar.",
  },
  {
    n: "3",
    title: "Publicás tu stock",
    body: "Cargás corte, kilos, fotos y condiciones. Vos decidís qué y cuándo publicar.",
  },
];

const BENEFICIOS = [
  {
    t: "Publicás vos, cuando querés",
    d: "No dependés de nadie para cargar o bajar un lote. Tu stock, tu ritmo.",
  },
  {
    t: "Compradores de todo el país",
    d: "Tu lote llega más allá de tu agenda de siempre, sin sumar viajantes.",
  },
  {
    t: "El sello te distingue",
    d: "Solo los frigoríficos verificados publican. El comprador lo ve en cada lote.",
  },
  {
    t: "El comprador te paga directo",
    d: "Cobrás vos. DeCarnes no intermedia el pago.",
  },
];

export default async function VendedoresPage() {
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const logueado = Boolean(user);

  return (
    <>
      <TopBar />
      <Header logueado={logueado} />
      <main>
        {/* Gancho principal: beta + fundadores (escasez, sin contador ni cupo duro) */}
        <section className="border-b border-borde bg-fondo">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-primario">
              <span className="h-px w-6 bg-primario" aria-hidden="true" />
              Beta abierta · cupos limitados
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.08] text-texto">
              Sumate como frigorífico fundador.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-texto-sec">
              Estamos abriendo DeCarnes con un grupo reducido de frigoríficos. Los que
              entran ahora publican primero, toman la delantera frente a los compradores
              y acceden a <span className="text-texto">tarifas preferenciales</span>{" "}
              cuando lancemos oficialmente.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href={logueado ? "/cuenta/publicar" : "/sumate"}
                className="bg-primario px-8 py-4 text-base font-medium text-superficie transition-colors hover:bg-primario-hover"
              >
                {logueado ? "Publicar lote" : "Quiero mi lugar"}
              </Link>
              <a
                href={site.whatsappVenderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-texto-sec underline-offset-4 transition-colors hover:text-texto hover:underline"
              >
                Hablar con un operador
              </a>
            </div>
          </div>
        </section>

        {/* Los tres pasos, con la verificación en el medio: es el requisito real */}
        <section className="bg-superficie py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-serif text-3xl font-medium text-texto sm:text-4xl">
              De la verificación a tu primer lote
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PASOS.map((p) => (
                <div key={p.n}>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primario-suave font-serif text-lg text-primario">
                    {p.n}
                  </span>
                  <h3 className="mt-5 font-serif text-xl font-medium text-texto">{p.title}</h3>
                  <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-texto-sec">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-10 max-w-2xl border-t border-borde pt-6 text-sm leading-relaxed text-texto-sec">
              Para publicar necesitás habilitación sanitaria vigente y CUIT activo.
            </p>
          </div>
        </section>

        {/* Beneficios del lado vendedor (no los del comprador) */}
        <section className="bg-fondo py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-serif text-3xl font-medium text-texto sm:text-4xl">
              Por qué publicar en DeCarnes
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {BENEFICIOS.map((b) => (
                <div key={b.t} className="border border-borde bg-superficie p-7">
                  <h3 className="font-serif text-xl font-medium text-texto">{b.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-texto-sec">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RespaldoMbeef compacto />
      </main>
      <Footer />
    </>
  );
}
