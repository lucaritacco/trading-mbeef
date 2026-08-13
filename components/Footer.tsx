import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-borde bg-superficie py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl font-semibold tracking-[0.08em] text-texto">
            DECARNES
          </p>
          <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-texto-sec">
            El mercado de la carne, impulsado por MBEEF.
          </p>
          <p className="mt-6 max-w-[34ch] text-[11px] uppercase leading-relaxed tracking-[0.28em] text-texto-sec">
            Powered by MBEEF · En el mercado de la carne desde 1994
          </p>
        </div>

        <div className="text-sm leading-relaxed text-texto-sec">
          <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-texto/60">
            MBEEF · Carne argentina
          </p>
          <p>{site.direccion}</p>
          <p className="mt-1">Tel: {site.tel}</p>
          {site.hasCuit && <p className="mt-1">CUIT: {site.cuit}</p>}
        </div>

        <div className="text-sm leading-relaxed text-texto-sec">
          <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-texto/60">
            Contacto
          </p>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-colors hover:text-texto"
          >
            WhatsApp: +54 9 291 414-5189
          </a>
          {site.hasMbeefUrl && (
            <a
              href={site.mbeefUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block transition-colors hover:text-texto"
            >
              Web institucional de MBEEF
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl border-t border-borde px-5 pt-6 sm:px-8">
        <p className="text-xs text-texto-sec">
          © {new Date().getFullYear()} MBEEF. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
