import { Reveal, Stagger, StaggerItem } from "./motion";

const STEPS = [
  {
    n: "1",
    title: "Mirás el catálogo",
    body: "Lotes de frigoríficos seleccionados, con especificaciones, fotos y ubicación.",
  },
  {
    n: "2",
    title: "Consultás el que te interesa",
    body: "Nos escribís por el lote y te pasamos disponibilidad, precio y condiciones.",
  },
  {
    n: "3",
    title: "Cerrás la operación",
    body: "Coordinamos la compra con el frigorífico. El retiro se coordina en cada operación.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-fondo py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium text-texto sm:text-5xl">
            Cómo funciona
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10" step={0.16}>
          {STEPS.map((step) => (
            <StaggerItem key={step.n}>
              <span className="inline-flex h-14 w-14 items-center justify-center border border-primario/40 bg-superficie font-serif text-2xl text-primario">
                {step.n}
              </span>
              <h3 className="mt-6 font-serif text-2xl font-medium leading-snug text-texto">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[38ch] leading-relaxed text-texto-sec">
                {step.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
