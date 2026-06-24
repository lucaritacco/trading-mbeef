"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/panel/actions";

const LINKS = [
  { href: "/panel", label: "Lotes" },
  { href: "/panel/solicitudes", label: "Solicitudes" },
  { href: "/panel/compradores", label: "Compradores" },
  { href: "/panel/config", label: "Configuración" },
];

export default function PanelNav({ email }: { email?: string }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  const activo = (href: string) =>
    href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-hueso/10 bg-carbon/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/panel" className="font-serif text-xl font-semibold tracking-[0.06em] text-hueso">
          DECARNES
          <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.25em] text-taupe">Mesa</span>
        </Link>

        {/* Escritorio */}
        <nav className="hidden items-center gap-5 text-sm text-taupe sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`transition-colors hover:text-hueso ${activo(l.href) ? "text-hueso" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 sm:flex">
          {email && <span className="hidden text-xs text-taupe md:inline">{email}</span>}
          <form action={cerrarSesion}>
            <button className="text-sm text-taupe transition-colors hover:text-hueso">Salir</button>
          </form>
        </div>

        {/* Celular: botón hamburguesa */}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label="Menú"
          aria-expanded={abierto}
          className="flex h-10 w-10 items-center justify-center text-hueso sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Celular: panel desplegable */}
      {abierto && (
        <div className="border-t border-hueso/10 px-5 py-3 sm:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAbierto(false)}
                className={`border-b border-hueso/5 py-3 text-sm transition-colors hover:text-hueso ${activo(l.href) ? "text-hueso" : "text-taupe"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between">
            {email && <span className="text-xs text-taupe">{email}</span>}
            <form action={cerrarSesion}>
              <button className="text-sm text-taupe transition-colors hover:text-hueso">Salir</button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
