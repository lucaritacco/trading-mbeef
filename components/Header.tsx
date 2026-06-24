import Link from "next/link";
import { site } from "@/lib/site";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hueso/10 bg-carbon/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-hueso">
            DECARNES
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-taupe md:inline">
            El mercado de la carne
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-taupe lg:flex">
          <a href="#como-funciona" className="transition-colors hover:text-hueso">
            Cómo funciona
          </a>
          <a href="#ventajas" className="transition-colors hover:text-hueso">
            Por qué
          </a>
          <a href="#servicios" className="transition-colors hover:text-hueso">
            Servicios
          </a>
          <a href="#requisitos" className="transition-colors hover:text-hueso">
            Requisitos
          </a>
          <a href="#faq" className="transition-colors hover:text-hueso">
            Preguntas
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-taupe transition-colors hover:text-hueso sm:inline"
          >
            Hablar con un operador
          </a>
          <Link
            href="/sumate"
            className="hidden bg-bordo px-4 py-2.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo sm:inline-block"
          >
            Sumate
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
