import { Counter, Reveal } from "./motion";

export default function TrustBar() {
  return (
    <section className="bg-hueso text-carbon">
      <Reveal>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex items-baseline gap-4">
            <Counter
              to={30}
              suffix="+"
              className="font-serif text-7xl font-medium leading-none text-bordo sm:text-8xl"
            />
            <p className="max-w-[16ch] text-sm uppercase tracking-[0.18em] text-carbon/70">
              años de MBEEF en el mercado de la carne
            </p>
          </div>

          <div className="hidden h-16 w-px bg-carbon/15 md:block" aria-hidden="true" />

          <div className="space-y-1.5">
            <p className="font-serif text-2xl font-medium">
              MBEEF · Carne argentina · Desde 1944
            </p>
            <p className="text-sm text-carbon/65">
              Operador mayorista de carne · Provincia de Buenos Aires
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
