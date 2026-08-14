import Link from "next/link";
import { LOTE_ESTADO, labelDe } from "@/lib/opciones";
import type { LoteFila } from "@/lib/ficha";

// Panel del hero: muestra stock REAL (los últimos publicados), no una ilustración.
// En un marketplace el mejor argumento es el stock mismo. El precio no se muestra
// nunca acá: dice "con cuenta", que es el gancho para registrarse.
export default function MockupStock({
  lotes,
  fotos,
  destino,
}: {
  lotes: LoteFila[];
  fotos: Map<string, string>;
  /** A dónde lleva tocar la card: al catálogo con sesión, a crear cuenta sin ella. */
  destino: string;
}) {
  if (lotes.length === 0) return null;

  return (
    <div className="relative">
      <div className="rounded-sm bg-primario p-6 sm:p-8">
        <div className="rounded-sm bg-superficie shadow-sm">
          <div className="flex items-center justify-between border-b border-borde px-5 py-3.5">
            <span className="font-serif text-base font-medium text-texto">Stock disponible</span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-texto-sec">
              <span className="h-1.5 w-1.5 rounded-full bg-exito" aria-hidden="true" />
              Actualizado
            </span>
          </div>

          <ul>
            {lotes.map((l) => {
              const foto = fotos.get(l.id);
              return (
                <li key={l.id} className="border-b border-borde last:border-b-0">
                  <Link href={destino} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-fondo">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-fondo">
                      {foto && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={foto} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-[15px] font-medium text-texto">
                        {l.titulo ?? l.corte ?? "Lote"}
                      </span>
                      <span className="block truncate text-[11px] text-texto-sec">
                        {[l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado), l.kilos_totales ? `${l.kilos_totales} kg` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[10px] font-medium uppercase leading-tight tracking-[0.1em] text-primario">
                      Precio
                      <br />
                      con cuenta
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Sello flotante: el argumento de confianza, encima del stock */}
      <div className="absolute -bottom-4 right-4 flex max-w-[15rem] items-start gap-2.5 rounded-sm border border-borde bg-superficie px-4 py-3 shadow-md sm:-right-4">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-exito/15 text-exito">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </span>
        <span>
          <span className="block text-xs font-medium text-texto">Verificado por DeCarnes</span>
          <span className="block text-[11px] leading-snug text-texto-sec">
            Identidad y documentación revisadas.
          </span>
        </span>
      </div>
    </div>
  );
}
