import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import EnterateForm from "@/components/EnterateForm";

export const metadata: Metadata = {
  title: "Enterate a tiempo de nuevas oportunidades | DeCarnes",
  description:
    "Dejanos tu nombre y email y te avisamos apenas se publica un lote nuevo de frigoríficos seleccionados. Sin costo.",
};

export default function EnteratePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-svh items-center justify-center px-5 py-32 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-salmon">Avisos de lotes nuevos</p>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-hueso sm:text-5xl">
              Enterate a tiempo de nuevas oportunidades.
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-taupe">
              Cada lote que se suma al catálogo, primero. Dejanos tu nombre y tu email
              y te avisamos apenas se publica un lote de frigoríficos seleccionados.
            </p>
            <p className="mt-4 text-sm text-taupe/70">
              ¿Vendés carne?{" "}
              <Link href="/#requisitos" className="text-salmon hover:text-hueso">
                Colocá tu stock con nosotros
              </Link>
              .
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <EnterateForm />
          </div>
        </div>
      </main>
    </>
  );
}
