import Link from "next/link";
import MockupStock from "./MockupStock";
import { PROVINCIAS } from "@/lib/opciones";
import type { LoteFila } from "@/lib/ficha";

const VENTAJAS = ["Alta sin costo", "Precios al ingresar", "Alertas de nuevos lotes"];

// Hero del marketplace. El buscador es la acción principal, así que va grande y
// arriba: producto + provincia, y manda a /mercado con los filtros aplicados.
// No pide ciudad a propósito: la localidad no se expone en público para no
// identificar al frigorífico.
export default function HeroBuscador({
  lotes,
  fotos,
  logueado,
}: {
  lotes: LoteFila[];
  fotos: Map<string, string>;
  logueado: boolean;
}) {
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

          {/* Buscador compuesto: producto + provincia */}
          <form
            action={logueado ? "/mercado" : "/registro"}
            method="get"
            className="mt-8 flex flex-col border border-borde bg-superficie sm:flex-row sm:items-stretch"
          >
            <div className="min-w-0 flex-1 border-b border-borde px-4 py-3 sm:border-b-0 sm:border-r">
              <label htmlFor="hero-q" className="block text-[10px] uppercase tracking-[0.16em] text-texto-sec">
                Producto
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="¿Qué corte buscás?"
                className="mt-1 w-full bg-transparent text-sm text-texto placeholder:text-texto-sec/70 outline-none"
              />
            </div>
            <div className="min-w-0 flex-1 border-b border-borde px-4 py-3 sm:border-b-0">
              <label htmlFor="hero-prov" className="block text-[10px] uppercase tracking-[0.16em] text-texto-sec">
                Ubicación
              </label>
              <select
                id="hero-prov"
                name="provincia"
                defaultValue=""
                className="mt-1 w-full bg-transparent text-sm text-texto outline-none"
              >
                <option value="">Provincia</option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-primario px-7 py-4 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:py-0"
            >
              Buscar lotes →
            </button>
          </form>

          {!logueado && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/registro"
                className="bg-tinta px-6 py-3.5 text-sm font-medium text-superficie transition-colors hover:bg-tinta-hover"
              >
                Crear cuenta comprador
              </Link>
              <Link
                href="/vendedores"
                className="text-sm font-medium text-primario underline-offset-4 transition-colors hover:underline"
              >
                Publicar mi stock →
              </Link>
            </div>
          )}

          <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2">
            {VENTAJAS.map((v) => (
              <li key={v} className="flex items-center gap-1.5 text-xs text-texto-sec">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-exito" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12.5l5 5L20 6.5" />
                </svg>
                {v}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <MockupStock lotes={lotes} fotos={fotos} />
        </div>
      </div>
    </section>
  );
}
