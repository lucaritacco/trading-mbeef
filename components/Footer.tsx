import Link from "next/link";
import { site } from "@/lib/site";

// Footer del marketplace. No lleva datos institucionales de MBEEF (dirección,
// CUIT, web): la relación comercial es con DeCarnes, y MBEEF aparece solo como
// respaldo. El único contacto es el WhatsApp operativo.
export default function Footer() {
  return (
    <footer className="border-t border-borde bg-superficie py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl font-semibold tracking-[0.12em] text-texto">
            DECARNES
          </p>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-texto-sec">
            El marketplace mayorista de carne de Argentina.
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-texto-sec">
            Impulsado por MBEEF
          </p>
        </div>

        <div className="text-sm leading-relaxed text-texto-sec">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-texto/60">
            Mercado
          </p>
          <Link href="/mercado" className="block transition-colors hover:text-texto">
            Ver lotes
          </Link>
          <Link href="/registro" className="mt-1 block transition-colors hover:text-texto">
            Crear cuenta
          </Link>
          <Link href="/login" className="mt-1 block transition-colors hover:text-texto">
            Ingresar
          </Link>
        </div>

        <div className="text-sm leading-relaxed text-texto-sec">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-texto/60">
            Frigoríficos
          </p>
          <Link href="/vendedores" className="block transition-colors hover:text-texto">
            Publicar mi stock
          </Link>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block transition-colors hover:text-texto"
          >
            Hablar por WhatsApp
          </a>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-borde px-5 pt-6 sm:px-8">
        <p className="text-xs text-texto-sec">
          © {new Date().getFullYear()} DeCarnes
        </p>
      </div>
    </footer>
  );
}
