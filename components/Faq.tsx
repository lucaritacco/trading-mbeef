"use client";

import { useState } from "react";
import { Reveal } from "./motion";

const PREGUNTAS = [
  {
    q: "¿Qué es DeCarnes?",
    a: "Un mercado donde la oferta y la demanda de carne de todo el país publican y se encuentran. Publicar es gratis.",
  },
  {
    q: "¿Tiene costo?",
    a: "Publicar y navegar el mercado es gratis. Algunos servicios de operación de MBEEF son bajo consulta.",
  },
  {
    q: "¿Quién puede publicar?",
    a: "Empresas del rubro con habilitación sanitaria vigente, inscripción RUCA y CUIT activo.",
  },
  {
    q: "¿Qué rol juega MBEEF?",
    a: "MBEEF impulsa la plataforma y opera en el mercado como un actor más, con más de 30 años de trayectoria.",
  },
  {
    q: "¿Cómo contacto a la otra parte?",
    a: "Desde la publicación coordinás el contacto para cerrar la operación.",
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
