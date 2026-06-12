"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./motion";
import { site } from "@/lib/site";

const LINE_1 = "Tu problema no es producir.";
const LINE_2 = "Es vender.";

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
        <motion.span
          key={`${word}-${i}`}
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
          {" "}
        </motion.span>
      ))}
    </span>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const subDelay = 0.15 + (LINE_1.split(" ").length + LINE_2.split(" ").length) * 0.09;

  return (
    <section className="relative flex min-h-svh flex-col justify-end overflow-hidden">
      {/* Foto provisional: reemplazar por fotografía propia de producto (ver public/images/LEEME.md) */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Cortes de carne vacuna sobre tabla de carnicero"
          fill
          priority
          sizes="100vw"
          className="kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/75 to-carbon/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/70 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20">
        <h1 className="max-w-4xl font-serif text-[clamp(2.6rem,8vw,5.5rem)] font-medium leading-[1.04] text-hueso">
          <StaggeredLine text={LINE_1} baseDelay={0.15} reduced={!!reduced} />
          <StaggeredLine
            text={LINE_2}
            className="text-rojo-claro"
            baseDelay={0.15 + LINE_1.split(" ").length * 0.09 + 0.1}
            reduced={!!reduced}
          />
        </h1>

        <motion.p
          className="mt-7 max-w-xl text-base leading-relaxed text-hueso/85 sm:text-lg"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: subDelay, ease: EASE }}
        >
          Publicá tu lote. Nosotros lo colocamos, garantizamos el cobro y
          coordinamos la logística. Oferta en firme en menos de 24 horas.
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
            Publicar un lote
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

        <motion.a
          href={site.mbeefUrl}
          className="mt-12 inline-flex items-center gap-3 border-t border-hueso/15 pt-5 text-[11px] uppercase tracking-[0.3em] text-taupe transition-colors hover:text-hueso"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: subDelay + 0.35 }}
        >
          Operaciones respaldadas por MBEEF · Frigorífico en actividad
        </motion.a>
      </div>
    </section>
  );
}
