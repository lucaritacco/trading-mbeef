import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-hueso/10 bg-carbon py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl font-semibold tracking-[0.08em] text-hueso">
            DECARNES
          </p>
          <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-taupe">
            El mercado de la carne, impulsado por MBEEF.
          </p>
          <p className="mt-6 max-w-[34ch] text-[11px] uppercase leading-relaxed tracking-[0.28em] text-taupe">
            Powered by MBEEF · En el mercado de la carne desde 1944
          </p>
        </div>

        <div className="text-sm leading-relaxed text-taupe">
          <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-hueso/60">
            MBEEF · Carne argentina
          </p>
          <p>{site.direccion}</p>
          <p className="mt-1">Tel: {site.tel}</p>
          {site.hasCuit && <p className="mt-1">CUIT: {site.cuit}</p>}
        </div>

        <div className="text-sm leading-relaxed text-taupe">
          <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-hueso/60">
            Contacto
          </p>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-colors hover:text-hueso"
          >
            WhatsApp: +54 9 291 538-2539
          </a>
          {site.hasMbeefUrl && (
            <a
              href={site.mbeefUrl}
              className="mt-1 block transition-colors hover:text-hueso"
            >
              Web institucional de MBEEF
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl border-t border-hueso/10 px-5 pt-6 sm:px-8">
        <p className="text-xs text-taupe/70">
          © {new Date().getFullYear()} MBEEF. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
