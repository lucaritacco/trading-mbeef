import { Reveal, Stagger, StaggerItem } from "./motion";

const COMPRAS = [
  {
    n: "1",
    title: "Mirás el catálogo",
    body: "Lotes de frigoríficos seleccionados, con especificaciones, fotos y ubicación.",
  },
  {
    n: "2",
    title: "Consultás el que te interesa",
    body: "Nos escribís por el lote y te pasamos disponibilidad y condiciones.",
  },
  {
    n: "3",
    title: "Cerrás la operación",
    body: "Coordinamos la compra con el frigorífico. El retiro se coordina en cada operación.",
  },
];

const VENDES = [
  {
    n: "1",
    title: "Nos pasás tu stock",
    body: "Nos contás qué tenés disponible: cortes, cantidad, ubicación.",
  },
  {
    n: "2",
    title: "Lo publicamos y salimos a colocarlo",
    body: "Publicamos tu lote y lo ofrecemos activamente en nuestra red de compradores.",
  },
  {
    n: "3",
    title: "El comprador te paga directo",
    body: "Cobrás vos, directo del comprador. Nosotros cobramos comisión solo cuando se vende.",
  },
];

function Camino({ etiqueta, pasos }: { etiqueta: string; pasos: typeof COMPRAS }) {
  return (
    <div>
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.3em] text-salmon">{etiqueta}</p>
      </Reveal>
      <Stagger className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8" step={0.14}>
        {pasos.map((step) => (
          <StaggerItem key={step.n}>
            <span className="inline-flex h-12 w-12 items-center justify-center border border-salmon/60 bg-carbon font-serif text-xl text-salmon">
              {step.n}
            </span>
            <h3 className="mt-5 font-serif text-xl font-medium leading-snug text-hueso">
              {step.title}
            </h3>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-taupe">
              {step.body}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-carbon py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium text-hueso sm:text-5xl">
            Cómo funciona
          </h2>
        </Reveal>

        <div className="mt-16 space-y-16">
          <Camino etiqueta="Si comprás" pasos={COMPRAS} />
          <div className="border-t border-hueso/10 pt-16">
            <Camino etiqueta="Si vendés" pasos={VENDES} />
          </div>
        </div>
      </div>
    </section>
  );
}
