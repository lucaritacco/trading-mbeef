import Link from "next/link";
import type { MetricaMercado } from "@/lib/ficha";

// Hero del marketplace: una línea de propuesta de valor + slot de métrica.
// La métrica se calcula en vivo (metricas_mercado) y se oculta sola si todavía
// no hay volumen suficiente, para no mostrar un mercado vacío:
//   NEXT_PUBLIC_METRICA_VOLUMEN = "1" para habilitarla (default: apagada)
//   NEXT_PUBLIC_METRICA_MIN_LOTES = mínimo de lotes activos (default: 20)
const HABILITADA = process.env.NEXT_PUBLIC_METRICA_VOLUMEN === "1";
const MIN_LOTES = Number(process.env.NEXT_PUBLIC_METRICA_MIN_LOTES ?? 20);

const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export default function HeroMercado({ metrica }: { metrica: MetricaMercado | null }) {
  const mostrarMetrica =
    HABILITADA && metrica !== null && metrica.lotes_activos >= MIN_LOTES;

  return (
    <section className="border-b border-hueso/10 bg-carbon">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-8 sm:pb-12 sm:pt-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-salmon">
          Beta abierta · cupos limitados
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-[clamp(1.9rem,4.6vw,3.4rem)] font-medium leading-[1.1] text-hueso">
          La bolsa de carne argentina: lotes de frigoríficos, en un solo lugar.
        </h1>

        {/* Slot de métrica de volumen (vacío hasta que haya mercado). */}
        {mostrarMetrica && (
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-taupe">Lotes activos</dt>
              <dd className="mt-1 font-serif text-3xl text-hueso">{metrica.lotes_activos}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-taupe">Kilos ofertados</dt>
              <dd className="mt-1 font-serif text-3xl text-hueso">{kg.format(metrica.kilos_totales)} kg</dd>
            </div>
          </dl>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/mercado"
            className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo"
          >
            Ver todos los lotes
          </Link>
          <Link
            href="/vendedores"
            className="text-base text-taupe underline-offset-4 transition-colors hover:text-hueso hover:underline"
          >
            Quiero vender mi stock
          </Link>
        </div>
      </div>
    </section>
  );
}
