"use client";

import { useState } from "react";
import { Reveal } from "./motion";

const PREGUNTAS = [
  {
    q: "¿Quién compra mi lote?",
    a: "Nuestra red de compradores activos: restaurantes, carnicerías y puntos de venta que ya operan con MBEEF. En algunos casos, el comprador es MBEEF directamente, con una compra en firme.",
  },
  {
    q: "¿Cómo me garantizan el cobro?",
    a: "La operación la cerrás con nosotros, no con el comprador final. El riesgo del comprador lo administramos nosotros, con años de historial de quién paga y cómo, y te garantizamos el cobro.",
  },
  {
    q: "¿Qué pasa si no les interesa mi lote?",
    a: "Te lo decimos en el mismo plazo. Sin vueltas.",
  },
  {
    q: "¿Quién paga el flete?",
    a: "Se define en la oferta, según la operación.",
  },
  {
    q: "¿Tiene costo publicar?",
    a: "No. Publicar y recibir oferta es gratis.",
  },
  {
    q: "¿Qué documentación necesito?",
    a: "Para publicar: constancia de inscripción en AFIP, habilitación sanitaria vigente e inscripción RUCA. La documentación de tránsito de cada operación la coordinamos junto con vos.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-hueso py-24 text-carbon sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl">
            Preguntas frecuentes
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-t border-carbon/15">
            {PREGUNTAS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="border-b border-carbon/15">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="font-serif text-xl font-medium leading-snug">
                      {item.q}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 shrink-0 text-bordo transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    className="faq-panel"
                    data-open={isOpen}
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <div>
                      <p className="max-w-[60ch] pb-6 leading-relaxed text-carbon/70">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
