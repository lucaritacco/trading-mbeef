import Link from "next/link";
import { Reveal } from "./motion";
import { site } from "@/lib/site";

export default function FinalCta() {
  return (
    <section className="bg-bordo py-28 text-hueso sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-3xl font-serif text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.05]">
            Sumate al mercado de la carne.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-hueso/85">
            Publicá tus cortes y conectá con compradores de todo el país.
            Powered by MBEEF.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/sumate"
              className="bg-hueso px-8 py-4 text-base font-medium text-carbon transition-colors hover:bg-white"
            >
              Sumate
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
