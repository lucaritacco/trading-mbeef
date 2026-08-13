import { Reveal } from "./motion";
import { site } from "@/lib/site";

// Franja chica para el lado vendedor: el público de la landing es el comprador,
// así que el vendedor queda en una banda discreta antes del CTA final.
export default function Requirements() {
  return (
    <section id="requisitos" className="bg-superficie py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col gap-6 border border-borde bg-fondo/[0.03] p-7 sm:p-9 md:flex-row md:items-center md:justify-between md:gap-10">
            <div>
              <h2 className="font-serif text-2xl font-medium text-texto">
                ¿Tenés stock para colocar?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-texto-sec">
                Trabajamos con frigoríficos habilitados: nos pasás tu stock, lo
                publicamos y lo colocamos en nuestra red de compradores. Coordinamos
                la logística de cada operación. El comprador te paga directo a vos y
                cobramos comisión solo cuando se vende.
              </p>
              <p className="mt-2 text-xs text-texto-sec">
                Necesitás habilitación sanitaria vigente y CUIT activo.
              </p>
            </div>
            <a
              href={site.whatsappVenderHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start bg-primario px-6 py-3.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover md:self-auto"
            >
              Escribinos
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
