"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Comprar carne" },
  { href: "/mercado", label: "Ver todos los lotes" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/vendedores", label: "Para frigoríficos" },
];

export default function MobileMenu({ logueado = false }: { logueado?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Menú"
        aria-expanded={abierto}
        className="flex h-10 w-10 items-center justify-center text-texto"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {abierto && (
        <div className="absolute inset-x-0 top-16 border-b border-borde bg-superficie/95 px-5 py-3 backdrop-blur-md">
          <form action="/mercado" method="get" className="mb-3">
            <input
              name="q"
              type="search"
              placeholder="Buscar cortes, lotes…"
              aria-label="Buscar lotes"
              className="w-full border border-borde bg-fondo px-3 py-2.5 text-sm text-texto placeholder:text-texto-sec outline-none focus:border-primario"
            />
          </form>

          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={cerrar}
                className="border-b border-borde py-3 text-sm text-texto-sec transition-colors hover:text-texto"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={cerrar}
              className="border-b border-borde py-3 text-sm text-texto-sec transition-colors hover:text-texto"
            >
              Hablar con un operador
            </a>

            {logueado ? (
              <Link
                href="/cuenta"
                onClick={cerrar}
                className="mt-2 bg-primario px-4 py-3 text-center text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={cerrar}
                  className="py-3 text-sm text-texto-sec transition-colors hover:text-texto"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  onClick={cerrar}
                  className="mt-2 bg-primario px-4 py-3 text-center text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
