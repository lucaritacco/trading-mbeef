"use client";

import { motion } from "framer-motion";
import { EASE, Reveal } from "./motion";

const ROWS = [
  {
    label: "Proveedores",
    solo: "Los mismos de siempre",
    decarnes: "Frigoríficos seleccionados de varias provincias",
  },
  {
    label: "Precios",
    solo: "Negociás a ciegas",
    decarnes: "Comparás lotes en una pantalla",
  },
  {
    label: "Búsqueda",
    solo: "Llamás uno por uno",
    decarnes: "Ves lo disponible en un solo lugar",
  },
  {
    label: "Respaldo",
    solo: "Proveedor desconocido",
    decarnes: "Seleccionado por MBEEF, +30 años",
  },
];

function Cross() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="var(--primario)"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <motion.path
        d="M6 6l12 12"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE }}
      />
      <motion.path
        d="M18 6L6 18"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
      />
    </svg>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="var(--exito)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.path
        d="M4 12.5l5 5L20 6.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
      />
    </svg>
  );
}

export default function Comparison() {
  return (
    <section className="bg-superficie py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-serif text-4xl font-medium text-texto sm:text-5xl">
            Comprar hoy vs. comprar con DeCarnes
          </h2>
        </Reveal>

        <div className="mt-14 overflow-hidden border border-borde">
          <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] border-b border-borde bg-fondo/5 text-[11px] uppercase tracking-[0.22em] text-texto-sec md:grid">
            <span className="px-6 py-4" />
            <span className="px-6 py-4">Comprar hoy</span>
            <span className="px-6 py-4 text-texto">Con DeCarnes</span>
          </div>

          {ROWS.map((row, i) => (
            <Reveal key={row.label} delay={i * 0.06}>
              <div
                className={`grid gap-x-6 gap-y-3 px-6 py-6 md:grid-cols-[1fr_1.2fr_1.2fr] md:items-center md:gap-y-0 ${
                  i > 0 ? "border-t border-borde" : ""
                }`}
              >
                <h3 className="font-serif text-xl font-medium text-texto">
                  {row.label}
                </h3>
                <p className="flex items-center gap-3 text-sm leading-snug text-texto-sec">
                  <Cross />
                  <span>
                    <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-texto-sec md:hidden">
                      Hoy:
                    </span>
                    {row.solo}
                  </span>
                </p>
                <p className="flex items-center gap-3 text-sm leading-snug text-texto/90">
                  <Check />
                  <span>
                    <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-texto-sec md:hidden">
                      Con DeCarnes:
                    </span>
                    {row.decarnes}
                  </span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
