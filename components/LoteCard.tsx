import Link from "next/link";
import { LOTE_ESTADO, labelDe } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";
import type { LoteFila } from "@/lib/ficha";

// Tarjeta de lote para catálogos (home y /mercado). El precio NO viaja en los
// datos públicos: llega solo si hay sesión (mapa de precios_lotes). Sin sesión
// se muestra el gancho para iniciar sesión, y la tarjeta sigue siendo indexable.
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
      className="group flex flex-col border border-borde transition-colors hover:border-primario"
    >
      <div className="aspect-[4/3] overflow-hidden bg-fondo">
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
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-serif text-xl font-medium text-texto group-hover:text-primario">
          {l.titulo ?? "—"}
        </h2>
        <p className="mt-1 text-sm text-texto-sec">
          {[l.corte, l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-3 text-sm text-texto-sec">
          {[l.kilos_totales ? `${l.kilos_totales} kg` : null, l.ubicacion_provincia]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>

        {logueado ? (
          precio != null && (
            <p className="mt-2 font-serif text-lg text-texto">
              {formatARS(precio)}
              <span className="text-sm text-texto-sec"> /kg</span>
            </p>
          )
        ) : (
          <p className="mt-2 text-sm text-texto-sec">Precio visible con tu cuenta</p>
        )}

        <span className="mt-auto pt-4 text-xs uppercase tracking-[0.18em] text-primario">
          Ver lote →
        </span>
      </div>
    </Link>
  );
}
