import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { site } from "@/lib/site";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hueso/10 bg-carbon/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-hueso">
            DECARNES
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-taupe lg:flex">
          <a href="/#como-funciona" className="transition-colors hover:text-hueso">
            Cómo funciona
          </a>
          <a href="/#ventajas" className="transition-colors hover:text-hueso">
            Por qué
          </a>
          <a href="/#requisitos" className="transition-colors hover:text-hueso">
            Requisitos
          </a>
          <a href="/#faq" className="transition-colors hover:text-hueso">
            Preguntas
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/enterate"
            className="hidden text-sm text-taupe transition-colors hover:text-hueso sm:inline"
          >
            Ver lotes publicados
          </Link>
          <Link
            href="/login"
            className="hidden text-sm text-taupe transition-colors hover:text-hueso sm:inline"
          >
            Ingresar
          </Link>
          <a
            href={site.whatsappVenderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden bg-bordo px-4 py-2.5 text-sm font-medium text-hueso transition-colors hover:bg-rojo sm:inline-block"
          >
            Quiero vender
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
