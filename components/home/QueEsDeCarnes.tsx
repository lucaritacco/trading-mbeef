import Link from "next/link";

// Bloque corto al pie de la home: qué es DeCarnes + los dos accesos por audiencia.
export default function QueEsDeCarnes() {
  return (
    <section className="border-t border-hueso/10 bg-carbon">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <div>
            <h2 className="font-serif text-2xl font-medium text-hueso sm:text-3xl">
              Qué es DeCarnes
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-taupe">
              Una bolsa de carne argentina entre pares: los frigoríficos publican los
              lotes que tienen disponibles y los compradores los encuentran en un solo
              lugar, con especificaciones, fotos y zona. Operado por MBEEF, con más de
              30 años en el mercado.
            </p>
            <p className="mt-3 text-sm text-taupe/70">
              Estamos en beta: sumamos frigoríficos de a poco para cuidar la calidad de
              lo que se publica.
            </p>
          </div>

          <div className="grid gap-4 self-center sm:grid-cols-2 md:grid-cols-1">
            <Link
              href="/compradores"
              className="group border border-hueso/15 p-5 transition-colors hover:border-bordo"
            >
              <p className="font-serif text-lg text-hueso transition-colors group-hover:text-rojo-claro">
                Soy comprador
              </p>
              <p className="mt-1 text-sm text-taupe">
                Enterate de cada lote nuevo y consultá el que te sirva.
              </p>
            </Link>
            <Link
              href="/vendedores"
              className="group border border-hueso/15 p-5 transition-colors hover:border-bordo"
            >
              <p className="font-serif text-lg text-hueso transition-colors group-hover:text-rojo-claro">
                Soy vendedor
              </p>
              <p className="mt-1 text-sm text-taupe">
                Publicá tu stock y llegá a compradores de todo el país.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
