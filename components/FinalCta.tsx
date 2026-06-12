import Link from "next/link";
import { Reveal } from "./motion";
import { site } from "@/lib/site";

export default function FinalCta() {
  return (
    <section className="bg-bordo py-28 text-hueso sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-3xl font-serif text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.05]">
            Dejá de esperar comprador.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-hueso/85">
            Publicá tu lote hoy y recibí una oferta en firme en menos de 24
            horas hábiles. Nosotros lo colocamos, garantizamos el cobro y
            coordinamos la logística.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/publicar"
              className="bg-hueso px-8 py-4 text-base font-medium text-carbon transition-colors hover:bg-white"
            >
              Publicar un lote
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-hueso/40 px-8 py-4 text-base text-hueso transition-colors hover:border-hueso"
            >
              Hablar con un operador
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
