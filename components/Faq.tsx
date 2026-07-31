"use client";

import { useState } from "react";
import { Reveal } from "./motion";

const PREGUNTAS = [
  {
    q: "¿Qué es DeCarnes?",
    a: "Un catálogo de lotes de frigoríficos seleccionados por MBEEF, operador del mercado desde 1994.",
  },
  {
    q: "¿Cómo compro un lote?",
    a: "Consultás el lote que te interesa y coordinamos la operación con el frigorífico.",
  },
  {
    q: "¿Tiene costo consultar?",
    a: "No. Ver el catálogo y consultar es gratis.",
  },
  {
    q: "¿Y el flete?",
    a: "El retiro y el transporte se coordinan en cada operación.",
  },
  {
    q: "¿Quién selecciona los frigoríficos?",
    a: "MBEEF, con más de 30 años en el rubro. Trabajamos con proveedores que conocemos.",
  },
  {
    q: "¿Puedo vender mi stock a través de DeCarnes?",
    a: "Sí: nos pasás tu stock, lo publicamos y lo colocamos. El comprador te paga directo y cobramos comisión solo cuando se vende. Escribinos.",
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
