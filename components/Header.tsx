"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";

// Los dos lados del mercado primero (oferta y demanda), después el resto.
const SECCIONES = [
  { href: "/", label: "Lotes" },
  { href: "/solicitudes", label: "Solicitudes" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/vendedores", label: "Para frigoríficos" },
];

// Header del marketplace. El buscador ya no vive acá: en la home es la acción
// principal y va grande en el hero; en el resto del sitio el usuario ya está
// dentro del catálogo, donde tiene los filtros.
export default function Header({ logueado = false }: { logueado?: boolean }) {
  const pathname = usePathname() ?? "/";

  const esActivo = (href: string) => {
    if (href.startsWith("/#")) return false; // ancla: nunca marca activo
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-superficie/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          <span className="font-serif text-2xl font-semibold tracking-[0.12em] text-texto">
            DECARNES
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={
                esActivo(s.href)
                  ? "font-medium text-primario"
                  : "text-texto-sec transition-colors hover:text-texto"
              }
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {logueado ? (
            <Link
              href="/cuenta"
              className="hidden bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:inline-block"
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
                href="/registro"
                className="hidden bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:inline-block"
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
