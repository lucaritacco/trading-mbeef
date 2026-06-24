"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

const SECCIONES = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#ventajas", label: "Por qué" },
  { href: "#servicios", label: "Servicios" },
  { href: "#requisitos", label: "Requisitos" },
  { href: "#faq", label: "Preguntas" },
];

export default function MobileMenu() {
  const [abierto, setAbierto] = useState(false);

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
          <nav className="flex flex-col">
            {SECCIONES.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setAbierto(false)}
                className="border-b border-hueso/5 py-3 text-sm text-taupe transition-colors hover:text-hueso"
              >
                {s.label}
              </a>
            ))}
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
              className="py-3 text-sm text-taupe transition-colors hover:text-hueso"
            >
              Hablar con un operador
            </a>
            <Link
              href="/sumate"
              onClick={() => setAbierto(false)}
              className="mt-2 bg-bordo px-4 py-3 text-center text-sm font-medium text-hueso transition-colors hover:bg-rojo"
            >
              Sumate
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
