"use client";

import { motion } from "framer-motion";
import { EASE, Reveal, Stagger, StaggerItem } from "./motion";

const STEPS = [
  {
    n: "1",
    title: "Publicás tu lote",
    body: "Cargás la ficha en 5 minutos: producto, faena, envasado, fotos y tu precio pretendido.",
  },
  {
    n: "2",
    title: "Recibís una oferta en firme en menos de 24 horas hábiles",
    body: "Nuestro equipo analiza el lote y te ofrece comprártelo o colocarlo en nuestra red de compradores. Vos elegís.",
  },
  {
    n: "3",
    title: "Cobrás. Del resto nos ocupamos nosotros",
    // TODO: redacción de garantía de cobro pendiente de definición comercial — no publicar a producción sin resolver
    body: "Colocación, cobranza garantizada y coordinación del flete refrigerado. Tu lote vendido, tu plata segura.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-carbon py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-serif text-4xl font-medium text-hueso sm:text-5xl">
            Cómo funciona
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* Línea conectora que se dibuja al hacer scroll (solo escritorio) */}
          <svg
            className="pointer-events-none absolute left-0 top-7 hidden h-px w-full md:block"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.line
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="var(--salmon)"
              strokeOpacity="0.5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
            />
          </svg>

          <Stagger className="grid gap-12 md:grid-cols-3 md:gap-10" step={0.18}>
            {STEPS.map((step) => (
              <StaggerItem key={step.n} className="relative">
                <span className="relative inline-flex h-14 w-14 items-center justify-center border border-salmon/60 bg-carbon font-serif text-2xl text-salmon">
                  {step.n}
                </span>
                <h3 className="mt-6 font-serif text-2xl font-medium leading-snug text-hueso">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[38ch] leading-relaxed text-taupe">
                  {step.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
