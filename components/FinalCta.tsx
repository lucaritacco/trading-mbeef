import Link from "next/link";
import { Reveal } from "./motion";

export default function FinalCta() {
  return (
    <section className="bg-bordo py-28 text-hueso sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-3xl font-serif text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.05]">
            Mirá los lotes disponibles.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-hueso/85">
            Cortes de frigoríficos seleccionados, actualizados. Consultar es gratis.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/mercado"
              className="bg-hueso px-8 py-4 text-base font-medium text-carbon transition-colors hover:bg-white"
            >
              Ver lotes
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
