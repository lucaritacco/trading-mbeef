import Link from "next/link";
import LoteCard from "@/components/LoteCard";
import type { LoteFila } from "@/lib/ficha";

const MINIMO = 6;

// Chips: solo estados que existen de verdad en el modelo (enfriado / congelado).
// Cada uno lleva al catálogo con el filtro ya aplicado.
const CHIPS = [
  { label: "Todos", href: "/mercado" },
  { label: "Enfriado", href: "/mercado?estado=enfriado" },
  { label: "Congelado", href: "/mercado?estado=congelado" },
];

// Hueco de la grilla cuando todavía hay pocos lotes. Solo el primero lleva el
// ámbar: la regla es un ámbar por pantalla.
function Invitacion({ destacada }: { destacada: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed p-8 text-center ${
        destacada ? "border-acento bg-acento/5" : "border-borde"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center border border-borde text-texto-sec">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <p className="mt-4 font-serif text-lg text-texto">Tu lote podría estar acá</p>
      <p className="mt-1 text-sm text-texto-sec">
        Estamos sumando los primeros frigoríficos de la beta.
      </p>
      <Link
        href="/vendedores"
        className={
          destacada
            ? "mt-5 bg-acento px-5 py-2.5 text-sm font-semibold text-texto transition-colors hover:brightness-95"
            : "mt-5 text-sm text-primario underline-offset-4 transition-colors hover:underline"
        }
      >
        Publicar lote
      </Link>
    </div>
  );
}

export default function LotesDisponibles({
  lotes,
  fotos,
  precios,
  logueado,
}: {
  lotes: LoteFila[];
  fotos: Map<string, string>;
  precios: Map<string, number>;
  logueado: boolean;
}) {
  const huecos = Math.max(0, MINIMO - lotes.length);

  return (
    <section className="bg-fondo">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Mercado DeCarnes</p>
            <h2 className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.9rem)] font-medium leading-tight text-texto">
              Lotes disponibles ahora.
            </h2>
          </div>
          <Link href="/mercado" className="text-sm font-medium text-primario underline-offset-4 transition-colors hover:underline">
            Ver todos los lotes →
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c, i) => (
              <Link
                key={c.label}
                href={c.href}
                className={
                  i === 0
                    ? "rounded-full bg-tinta px-4 py-1.5 text-xs font-medium text-superficie"
                    : "rounded-full border border-borde px-4 py-1.5 text-xs text-texto-sec transition-colors hover:border-primario hover:text-primario"
                }
              >
                {c.label}
              </Link>
            ))}
          </div>

          {/* Alertas: el gancho para dejar el mail cuando todavía hay poco stock */}
          <div className="flex flex-wrap items-center justify-between gap-3 border border-borde bg-superficie px-4 py-2.5 lg:ml-auto">
            <span className="flex items-center gap-2 text-xs text-texto-sec">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primario text-[9px] font-bold text-superficie">!</span>
              Enterate cuando se sumen frigoríficos o aparezcan nuevos lotes
            </span>
            <Link
              href="/compradores"
              className="bg-primario px-4 py-1.5 text-xs font-medium text-superficie transition-colors hover:bg-primario-hover"
            >
              Activar alertas
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lotes.map((l) => (
            <LoteCard
              key={l.id}
              l={l}
              foto={fotos.get(l.id)}
              precio={precios.get(l.id)}
              logueado={logueado}
            />
          ))}
          {Array.from({ length: huecos }).map((_, i) => (
            <Invitacion key={`hueco-${i}`} destacada={i === 0 && !logueado} />
          ))}
        </div>
      </div>
    </section>
  );
}
