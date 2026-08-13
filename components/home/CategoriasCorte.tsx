import Link from "next/link";
import {
  IconAsado,
  IconBife,
  IconLomo,
  IconNalga,
  IconManta,
  IconMediaRes,
  IconAchuras,
  IconTrimming,
} from "./IconosCorte";

// Fila de categorías por corte. Cada una filtra el catálogo completo (/mercado).
// Son agrupaciones comerciales: el `corte` que mandamos coincide con los valores
// de CORTES en lib/opciones.ts para que el filtro matchee.
const CATEGORIAS = [
  { label: "Asado", corte: "Asado", Icon: IconAsado },
  { label: "Bifes", corte: "Bife ancho", Icon: IconBife },
  { label: "Lomo", corte: "Lomo", Icon: IconLomo },
  { label: "Nalga", corte: "Nalga", Icon: IconNalga },
  { label: "Vacío", corte: "Vacío", Icon: IconManta },
  { label: "Matambre", corte: "Matambre", Icon: IconMediaRes },
  { label: "Paleta", corte: "Paleta", Icon: IconAchuras },
  { label: "Entraña", corte: "Entraña", Icon: IconTrimming },
];

export default function CategoriasCorte() {
  return (
    <section className="border-y border-borde bg-superficie">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-texto-sec">
            Buscá por corte
          </h2>
          <Link href="/mercado" className="text-sm text-primario transition-colors hover:text-texto">
            Ver todos →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
          {CATEGORIAS.map(({ label, corte, Icon }) => (
            <Link
              key={label}
              href={`/mercado?corte=${encodeURIComponent(corte)}`}
              className="group flex flex-col items-center gap-2 border border-borde px-2 py-4 text-center transition-colors hover:border-primario hover:bg-fondo/[0.03]"
            >
              <Icon className="h-7 w-7 text-texto-sec transition-colors group-hover:text-primario" />
              <span className="text-[11px] leading-tight text-texto-sec transition-colors group-hover:text-texto sm:text-xs">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
