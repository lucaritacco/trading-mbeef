import Image from "next/image";
import { Reveal } from "./motion";
import { site } from "@/lib/site";

export default function RespaldoMbeef() {
  return (
    <section className="bg-carbon py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 md:grid-cols-2 md:gap-16">
        <Reveal className="relative aspect-[4/3] overflow-hidden">
          {/* Foto provisional: reemplazar por fotografía propia (ver public/images/LEEME.md) */}
          <Image
            src="/images/campo.jpg"
            alt="Hacienda en el campo al atardecer"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/50 to-transparent" />
        </Reveal>

        <Reveal delay={0.15}>
          <p className="font-serif text-3xl font-medium leading-snug text-hueso sm:text-4xl">
            DeCarnes es el mercado de carne impulsado por MBEEF, abierto a todos.
          </p>
          <p className="mt-6 leading-relaxed text-taupe">
            MBEEF es una empresa argentina dedicada a la compra y venta
            mayorista de carne, con raíces en el rubro desde 1944. Conocemos el
            mercado porque lo operamos todos los días: compramos, colocamos y
            movemos carne entre frigoríficos, distribuidores y puntos de venta
            de todo el país.
          </p>
          {/* [COMPLETAR] Historia real de MBEEF: reemplazar este párrafo marcado */}
          <p className="mt-4 border border-dashed border-taupe/40 p-4 text-sm leading-relaxed text-taupe/70">
            [HISTORIA MBEEF: completar acá 3 o 4 líneas reales de trayectoria
            de la empresa antes de publicar la página]
          </p>
          {site.hasMbeefUrl && (
            <a
              href={site.mbeefUrl}
              className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-salmon transition-colors hover:text-hueso"
            >
              Conocé MBEEF
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}
