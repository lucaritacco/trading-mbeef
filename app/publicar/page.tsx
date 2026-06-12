import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publicá tu lote | DeCarnes",
  description:
    "El formulario de publicación está en construcción. Mientras tanto, un operador de DeCarnes te toma el lote por WhatsApp.",
};

export default function PublicarPage() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center px-5 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">
          Operaciones respaldadas por MBEEF
        </p>
        <h1 className="mt-4 font-serif text-5xl font-medium text-hueso sm:text-6xl">
          Publicá tu lote
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-taupe">
          El formulario de publicación está en construcción. Mientras tanto,
          escribinos por WhatsApp: un operador de DeCarnes te toma los datos
          del lote y recibís tu oferta en el mismo plazo, en menos de 24 horas
          hábiles.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-bordo px-7 py-4 text-base font-medium text-hueso transition-colors hover:bg-rojo"
          >
            Publicar por WhatsApp
          </a>
          <Link
            href="/"
            className="border border-hueso/30 px-7 py-4 text-base text-hueso transition-colors hover:border-hueso/70"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
