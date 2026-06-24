"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./motion";
import { site } from "@/lib/site";

const LINE_1 = "El mercado de la carne, en un solo lugar.";
const LINE_2 = "Publicá tus cortes. Encontrá los que buscás.";

const SELLO = "Powered by MBEEF · En el mercado de la carne desde 1944";

// Cortes de referencia para la cinta de cotizaciones del hero.
// Solo nombres y dirección de tendencia: nunca valores monetarios.
const CORTES: { n: string; d: "up" | "down" }[] = [
  { n: "ASADO", d: "up" },
  { n: "VACÍO", d: "up" },
  { n: "CUADRADA", d: "down" },
  { n: "NALGA", d: "up" },
  { n: "MATAMBRE", d: "up" },
  { n: "BIFE ANCHO", d: "down" },
  { n: "BIFE ANGOSTO", d: "up" },
  { n: "PECETO", d: "up" },
  { n: "ROAST BEEF", d: "down" },
  { n: "TAPA DE NALGA", d: "up" },
  { n: "BOLA DE LOMO", d: "up" },
  { n: "AGUJA", d: "down" },
  { n: "PALETA", d: "up" },
  { n: "COLITA DE CUADRIL", d: "up" },
  { n: "LOMO", d: "down" },
];

function TickerRow() {
  return (
    <span className="inline-flex items-center">
      {CORTES.map((c, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="text-taupe">{c.n}</span>
          <span
            className={`ml-2 ${c.d === "up" ? "text-verde-claro" : "text-salmon"}`}
          >
            {c.d === "up" ? "▲" : "▼"}
          </span>
          <span className="px-5 text-hueso/20" aria-hidden="true">
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

function StaggeredLine({
  text,
  className,
  baseDelay,
  reduced,
}: {
  text: string;
  className?: string;
  baseDelay: number;
  reduced: boolean;
}) {
  return (
    <span className={`block ${className ?? ""}`}>
      {text.split(" ").map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: reduced ? 0 : "0.45em" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: baseDelay + i * 0.09,
              ease: EASE,
            }}
          >
            {word}
          </motion.span>{" "}
        </Fragment>
      ))}
    </span>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const subDelay =
    0.15 + (LINE_1.split(" ").length + LINE_2.split(" ").length) * 0.09;

  return (
    <section className="relative flex min-h-svh flex-col justify-end overflow-hidden">
      {/* Fondo "mesa de trading": carbón con un radial bordó muy oscuro */}
      <div className="absolute inset-0 -z-10 bg-carbon" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(115%_85%_at_50%_-5%,rgba(179,14,42,0.16),transparent_62%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_115%,rgba(0,0,0,0.45),transparent_70%)]" />

      {/* Cinta de cotizaciones (sin precios), loop continuo, se detiene con reduced-motion */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex h-9 items-center overflow-hidden border-t border-hueso/10 opacity-45"
        aria-hidden="true"
      >
        <div className="ticker-track font-mono text-[11px] uppercase tracking-[0.28em]">
          <TickerRow />
          <TickerRow />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-36 sm:px-8 sm:pb-28">
        <h1 className="max-w-4xl font-serif text-[clamp(2rem,7vw,5.5rem)] font-medium leading-[1.06] text-hueso">
          <StaggeredLine text={LINE_1} baseDelay={0.15} reduced={!!reduced} />
          <StaggeredLine
            text={LINE_2}
            className="text-rojo-claro"
            baseDelay={0.15 + LINE_1.split(" ").length * 0.09 + 0.1}
            reduced={!!reduced}
          />
        </h1>

        <motion.p
          className="mt-7 max-w-2xl text-base leading-relaxed text-hueso/85 sm:text-lg"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: subDelay, ease: EASE }}
        >
          DeCarnes conecta la oferta y la demanda de carne de todo el país.
          Publicar es gratis. Powered by MBEEF, operador del mercado desde 1944.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: subDelay + 0.15, ease: EASE }}
        >
          <Link
            href="/publicar"
            className="bg-bordo px-7 py-4 text-base font-medium text-hueso transition-colors hover:bg-rojo"
          >
            Sumate
          </Link>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-hueso/30 px-7 py-4 text-base text-hueso transition-colors hover:border-hueso/70"
          >
            Hablar con un operador
          </a>
        </motion.div>

        {site.hasMbeefUrl ? (
          <motion.a
            href={site.mbeefUrl}
            className="mt-12 inline-flex items-center gap-3 border-t border-hueso/15 pt-5 text-[11px] uppercase tracking-[0.3em] text-taupe transition-colors hover:text-hueso"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: subDelay + 0.35 }}
          >
            {SELLO}
          </motion.a>
        ) : (
          <motion.p
            className="mt-12 inline-flex items-center gap-3 border-t border-hueso/15 pt-5 text-[11px] uppercase tracking-[0.3em] text-taupe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: subDelay + 0.35 }}
          >
            {SELLO}
          </motion.p>
        )}
      </div>
    </section>
  );
}
