import Link from "next/link";

// Bifurcación explícita: comprador y frigorífico entran distinto. Se resuelve
// con jerarquía de color, no con dos botones iguales: el comprador va en tinta
// (acción neutra, es el volumen) y el frigorífico en bordó (es la marca).
export default function DosCaminos() {
  return (
    <section className="bg-fondo">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Empezá por acá</p>
            <h2 className="mt-3 max-w-xl font-serif text-[clamp(1.8rem,4vw,2.9rem)] font-medium leading-tight text-texto">
              Dos caminos, una misma plataforma.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-texto-sec md:text-right">
            El comprador accede al mercado.
            <br />
            El frigorífico verifica su perfil y publica.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col border border-borde bg-superficie p-8 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-texto-sec">Soy comprador</p>
            <h3 className="mt-4 font-serif text-2xl font-medium leading-snug text-texto sm:text-3xl">
              Encontrá lotes, compará y consultá rápido.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-texto-sec">
              Accedé a precios y recibí alertas de nuevos lotes.
            </p>
            <Link
              href="/registro"
              className="mt-auto inline-flex w-fit items-center gap-2 bg-tinta px-6 py-3.5 pt-3.5 text-sm font-medium text-superficie transition-colors hover:bg-tinta-hover"
            >
              Crear cuenta comprador →
            </Link>
          </div>

          <div className="flex flex-col bg-primario p-8 text-superficie sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-superficie/70">Soy frigorífico</p>
            <h3 className="mt-4 font-serif text-2xl font-medium leading-snug sm:text-3xl">
              Verificá tu empresa y publicá tu stock directamente.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-superficie/80">
              Administrá tus propias publicaciones en DeCarnes.
            </p>
            <Link
              href="/sumate"
              className="mt-auto inline-flex w-fit items-center gap-2 bg-superficie px-6 py-3.5 text-sm font-medium text-primario transition-colors hover:bg-fondo"
            >
              Registrar mi frigorífico →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
