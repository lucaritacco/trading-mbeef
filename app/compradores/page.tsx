import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnterateForm from "@/components/EnterateForm";
import HowItWorks from "@/components/HowItWorks";
import Comparison from "@/components/Comparison";
import Faq from "@/components/Faq";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PREGUNTAS } from "@/lib/faq";
import { jsonLdFaq, jsonLdProps } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/compradores" },
  title: "Comprá carne por lote | DeCarnes",
  description:
    "Encontrá lotes de frigoríficos en un solo lugar y enterate apenas se publica uno nuevo. Ver el catálogo y consultar es gratis.",
};

export default async function CompradoresPage() {
  const supabaseServer = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  return (
    <>
      <script {...jsonLdProps(jsonLdFaq(PREGUNTAS))} />
      <Header logueado={Boolean(user)} />
      <main>
        <section className="border-b border-hueso/10 bg-carbon">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-salmon">Para compradores</p>
              <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-hueso sm:text-5xl">
                Enterate a tiempo de nuevas oportunidades.
              </h1>
              <p className="mt-5 max-w-md leading-relaxed text-taupe">
                Cada lote que se suma al catálogo, primero. Dejanos tu nombre y tu email
                y te avisamos apenas se publica un lote de frigoríficos seleccionados.
              </p>
              <p className="mt-4 text-sm text-taupe/70">
                ¿Vendés carne?{" "}
                <Link href="/vendedores" className="text-salmon hover:text-hueso">
                  Publicá tu stock
                </Link>
                .
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <EnterateForm />
            </div>
          </div>
        </section>

        <HowItWorks />
        <Comparison />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
