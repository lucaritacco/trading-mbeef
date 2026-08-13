import Link from "next/link";
import { LOTE_ESTADO, labelDe } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";
import type { LoteFila } from "@/lib/ficha";

// Tarjeta de lote para catálogos (home y /mercado).
// · El precio NO viaja en los datos públicos: llega solo con sesión.
// · El sello "verificado" es dato real (usuarios.verificado), lo activa el staff
//   tras revisar al frigorífico, y es lo mismo que lo habilita a publicar. Es un
//   booleano: no identifica al proveedor.
export default function LoteCard({
  l,
  foto,
  precio,
  logueado = false,
}: {
  l: LoteFila;
  foto?: string;
  precio?: number;
  logueado?: boolean;
}) {
  return (
    <Link
      href={`/lote/${l.id}`}
      className="group flex flex-col border border-borde bg-superficie transition-colors hover:border-primario"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-fondo">
        {foto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={foto}
            alt={l.titulo ?? "Lote"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-texto-sec">
            Sin foto
          </span>
        )}

        {l.verificado && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-superficie/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-texto shadow-sm backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-exito" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            Frigorífico verificado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-medium leading-snug text-texto transition-colors group-hover:text-primario">
          {l.titulo ?? l.corte ?? "—"}
        </h3>
        <p className="mt-1.5 text-sm text-texto-sec">
          {[l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado)].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-sm text-texto-sec">
          {[l.kilos_totales ? `${l.kilos_totales} kg` : null, l.ubicacion_provincia]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>

        <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-borde pt-4">
          {logueado && precio != null ? (
            <span className="font-serif text-lg text-texto">
              {formatARS(precio)}
              <span className="text-sm text-texto-sec"> /kg</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-primario">Precio con tu cuenta</span>
          )}
          <span className="text-xs font-medium text-texto-sec transition-colors group-hover:text-texto">
            Ver lote →
          </span>
        </div>
      </div>
    </Link>
  );
}
