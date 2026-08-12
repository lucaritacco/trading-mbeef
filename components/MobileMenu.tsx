"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Comprar carne" },
  { href: "/vendedores", label: "Vender carne" },
  { href: "/mercado", label: "Ver todos los lotes" },
  { href: "/compradores", label: "Para compradores" },
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
        className="flex h-10 w-10 items-center justify-center text-hueso"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {abierto && (
        <div className="absolute inset-x-0 top-16 border-b border-hueso/10 bg-carbon/95 px-5 py-3 backdrop-blur-md">
          <form action="/mercado" method="get" className="mb-3">
            <input
              name="q"
              type="search"
              placeholder="Buscar cortes, lotes…"
              aria-label="Buscar lotes"
              className="w-full border border-hueso/20 bg-carbon/60 px-3 py-2.5 text-sm text-hueso placeholder:text-taupe/50 outline-none focus:border-bordo"
            />
          </form>

          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={cerrar}
                className="border-b border-hueso/5 py-3 text-sm text-taupe transition-colors hover:text-hueso"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={cerrar}
              className="border-b border-hueso/5 py-3 text-sm text-taupe transition-colors hover:text-hueso"
            >
              Hablar con un operador
            </a>

            {logueado ? (
              <Link
                href="/cuenta"
                onClick={cerrar}
                className="mt-2 bg-bordo px-4 py-3 text-center text-sm font-medium text-hueso transition-colors hover:bg-rojo"
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={cerrar}
                  className="py-3 text-sm text-taupe transition-colors hover:text-hueso"
                >
                  Ingresar
                </Link>
                <Link
                  href="/sumate"
                  onClick={cerrar}
                  className="mt-2 bg-bordo px-4 py-3 text-center text-sm font-medium text-hueso transition-colors hover:bg-rojo"
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
