import Link from "next/link";
import LoteCard from "@/components/LoteCard";
import type { LoteFila } from "@/lib/ficha";

const MINIMO = 6;

// Tarjeta que rellena los huecos cuando todavía hay pocos lotes: en vez de una
// grilla a medio llenar, cada hueco invita a publicar (escasez de beta).
// Solo la primera lleva el ámbar: la regla es un ámbar por pantalla, y repetirlo
// en cada hueco lo convertiría en decoración.
function Filler({ destacada }: { destacada: boolean }) {
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

export default function GrillaDestacados({
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
    <section className="bg-superficie">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-medium text-texto sm:text-3xl">
            Lotes destacados
          </h2>
          <Link href="/mercado" className="text-sm text-primario transition-colors hover:underline">
            Ver todos →
          </Link>
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
            <Filler key={`filler-${i}`} destacada={i === 0 && !logueado} />
          ))}
        </div>
      </div>
    </section>
  );
}
