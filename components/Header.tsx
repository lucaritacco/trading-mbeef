"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";

// Header del marketplace: toggle Comprar/Vender, buscador (manda a /mercado) y
// acceso a la cuenta. `logueado` lo resuelve el layout en el servidor.
export default function Header({ logueado = false }: { logueado?: boolean }) {
  const pathname = usePathname() ?? "/";
  const enVender = pathname.startsWith("/vendedores");

  const tab = (activo: boolean) =>
    `px-4 py-2 text-sm transition-colors ${
      activo ? "bg-primario text-superficie" : "text-texto-sec hover:text-superficie"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-superficie/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-texto">
            DECARNES
          </span>
        </Link>

        {/* Toggle Comprar / Vender */}
        <nav className="hidden shrink-0 items-center border border-borde sm:flex">
          <Link href="/" className={tab(!enVender)}>
            Comprar carne
          </Link>
          <Link href="/vendedores" className={tab(enVender)}>
            Vender carne
          </Link>
        </nav>

        {/* Buscador: va al catálogo completo con el término aplicado */}
        <form action="/mercado" method="get" className="ml-auto hidden min-w-0 flex-1 md:block">
          <div className="relative mx-auto max-w-sm">
            <input
              name="q"
              type="search"
              placeholder="Buscar cortes, lotes…"
              aria-label="Buscar lotes"
              className="w-full border border-borde bg-fondo py-2 pl-9 pr-3 text-sm text-texto placeholder:text-texto-sec outline-none transition-colors focus:border-primario"
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-sec"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0">
          {logueado ? (
            <Link
              href="/cuenta"
              className="hidden bg-primario px-4 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:inline-block"
            >
              Mi cuenta
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-texto-sec transition-colors hover:text-texto sm:inline"
              >
                Ingresar
              </Link>
              <Link
                href="/sumate"
                className="hidden bg-primario px-4 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:inline-block"
              >
                Crear cuenta
              </Link>
            </>
          )}
          <MobileMenu logueado={logueado} />
        </div>
      </div>
    </header>
  );
}
