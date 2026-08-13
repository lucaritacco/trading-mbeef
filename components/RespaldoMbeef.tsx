import Image from "next/image";
import { Reveal } from "./motion";

// `compacto` baja el peso visual del bloque (lo usamos en /vendedores: el respaldo
// de MBEEF va perdiendo protagonismo a medida que el marketplace se sostiene solo).
export default function RespaldoMbeef({ compacto = false }: { compacto?: boolean }) {
  return (
    <section className={compacto ? "bg-superficie py-14 sm:py-16" : "bg-superficie py-24 sm:py-32"}>
      <div
        className={`mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 md:grid-cols-2 md:gap-16 ${
          compacto ? "max-w-4xl" : ""
        }`}
      >
        <Reveal className="relative aspect-[4/3] overflow-hidden">
          {/* Foto de stock (Unsplash, licencia libre) — reemplazable por foto propia (ver public/images/LEEME.md) */}
          <Image
            src="/images/producto.jpg"
            alt="Cortes de carne vacuna sobre tabla de carnicero"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tinta/50 to-transparent" />
        </Reveal>

        <Reveal delay={0.15}>
          <p
            className={`font-serif font-medium leading-snug text-texto ${
              compacto ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            }`}
          >
            DeCarnes es el mercado de carne impulsado por MBEEF, abierto a todos.
          </p>
          <p className={`mt-6 leading-relaxed text-texto-sec ${compacto ? "text-sm" : ""}`}>
            MBEEF es una empresa argentina dedicada a la compra y venta
            mayorista de carne, con raíces en el rubro desde 1994. Conocemos el
            mercado porque lo operamos todos los días: compramos, colocamos y
            movemos carne entre frigoríficos, distribuidores y puntos de venta
            de todo el país.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
