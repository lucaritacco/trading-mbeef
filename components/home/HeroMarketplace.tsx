import Link from "next/link";
import MockupStock from "./MockupStock";
import type { LoteFila } from "@/lib/ficha";

const VENTAJAS = ["Alta sin costo", "Precios al ingresar", "Alertas de nuevos lotes"];

// Hero del marketplace. Sin buscador a propósito: con pocos lotes una búsqueda
// devuelve vacío casi siempre, y eso arruina la primera impresión. La acción del
// hero es abrir la cuenta; buscar y filtrar viven dentro del catálogo.
export default function HeroMarketplace({
  lotes,
  fotos,
  logueado,
}: {
  lotes: LoteFila[];
  fotos: Map<string, string>;
  logueado: boolean;
}) {
  const verLotes = logueado ? "/mercado" : "/registro";

  return (
    <section className="border-b border-borde bg-fondo">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-20 lg:pt-16">
        <div>
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-primario">
            <span className="h-px w-6 bg-primario" aria-hidden="true" />
            Marketplace mayorista de carne
          </p>

          <h1 className="mt-5 font-serif text-[clamp(2.2rem,5.2vw,3.9rem)] font-medium leading-[1.05] text-texto">
            El stock que buscás,
            <br />
            en un solo lugar.
          </h1>

          <p className="mt-5 max-w-lg leading-relaxed text-texto-sec">
            Compará lotes disponibles de frigoríficos verificados y consultá precio,
            origen y condiciones sin recorrer proveedor por proveedor.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={verLotes}
              className="bg-tinta px-7 py-4 text-base font-medium text-superficie transition-colors hover:bg-tinta-hover"
            >
              {logueado ? "Ver todos los lotes" : "Crear cuenta comprador"}
            </Link>
            <Link
              href="/vendedores"
              className="text-base font-medium text-primario underline-offset-4 transition-colors hover:underline"
            >
              Publicar mi stock →
            </Link>
          </div>

          {!logueado && (
            <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-2">
              {VENTAJAS.map((v) => (
                <li key={v} className="flex items-center gap-1.5 text-xs text-texto-sec">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-exito" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12.5l5 5L20 6.5" />
                  </svg>
                  {v}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden lg:block">
          <MockupStock lotes={lotes} fotos={fotos} destino={verLotes} />
        </div>
      </div>
    </section>
  );
}
