import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Advantages from "@/components/Advantages";
import Requirements from "@/components/Requirements";
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
    title: "Creás tu cuenta",
    body: "Nos dejás los datos de tu empresa y tu habilitación. Revisamos y te damos acceso.",
  },
  {
    n: "2",
    title: "Publicás tus lotes",
    body: "Cargás corte, kilos, fotos y condiciones en minutos. Vos decidís qué y cuándo publicar.",
  },
  {
    n: "3",
    title: "Recibís las consultas",
    body: "Los compradores interesados te escriben por WhatsApp. Coordinás la operación directo.",
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
      <Header logueado={logueado} />
      <main>
        {/* Gancho principal: beta + fundadores (escasez, sin contador ni cupo duro) */}
        <section className="border-b border-hueso/10 bg-carbon">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-[11px] uppercase tracking-[0.3em] text-salmon">
              Beta abierta · cupos limitados
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.08] text-hueso">
              Sumate como frigorífico fundador.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-taupe">
              Estamos abriendo DeCarnes con un grupo reducido de frigoríficos. Los que
              entran ahora publican primero, toman la delantera frente a los compradores
              y acceden a{" "}
              <span className="text-hueso">tarifas preferenciales</span> cuando lancemos
              oficialmente.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={logueado ? "/cuenta/publicar" : "/sumate"}
                className="bg-bordo px-8 py-4 text-base font-medium text-hueso transition-colors hover:bg-rojo"
              >
                {logueado ? "Publicar lote" : "Quiero mi lugar"}
              </Link>
              <a
                href={site.whatsappVenderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-taupe underline-offset-4 transition-colors hover:text-hueso hover:underline"
              >
                Hablar con un operador
              </a>
            </div>
          </div>
        </section>

        {/* Cómo funciona (self-service: el mensaje principal) */}
        <section className="bg-carbon py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-serif text-3xl font-medium text-hueso sm:text-4xl">
              Publicá lo que tenés hoy
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PASOS.map((p) => (
                <div key={p.n}>
                  <span className="inline-flex h-12 w-12 items-center justify-center border border-salmon/60 font-serif text-xl text-salmon">
                    {p.n}
                  </span>
                  <h3 className="mt-5 font-serif text-xl font-medium text-hueso">{p.title}</h3>
                  <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-taupe">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Advantages />

        {/* El servicio "te lo colocamos", como alternativa (no como mensaje central) */}
        <section className="border-y border-hueso/10 bg-carbon py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex flex-col gap-5 border border-hueso/12 bg-hueso/[0.03] p-7 sm:p-9 md:flex-row md:items-center md:justify-between md:gap-10">
              <div>
                <h2 className="font-serif text-2xl font-medium text-hueso">
                  ¿Preferís que lo coloquemos nosotros?
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-taupe">
                  Si no querés publicar vos, nos pasás tu stock y lo ofrecemos
                  activamente en nuestra red de compradores. Coordinamos la logística de
                  cada operación. El comprador te paga directo a vos.
                </p>
              </div>
              <a
                href={site.whatsappVenderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 self-start border border-hueso/30 px-6 py-3.5 text-sm text-hueso transition-colors hover:border-hueso/70 md:self-auto"
              >
                Escribinos
              </a>
            </div>
          </div>
        </section>

        <Requirements />
        <RespaldoMbeef compacto />
      </main>
      <Footer />
    </>
  );
}
