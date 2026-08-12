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
      className="group flex flex-col border border-hueso/15 transition-colors hover:border-bordo"
    >
      <div className="aspect-[4/3] overflow-hidden bg-carbon/40">
        {foto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={foto}
            alt={l.titulo ?? "Lote"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-taupe/50">
            Sin foto
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-serif text-xl font-medium text-hueso group-hover:text-rojo-claro">
          {l.titulo ?? "—"}
        </h2>
        <p className="mt-1 text-sm text-taupe">
          {[l.corte, l.especie_categoria, labelDe(LOTE_ESTADO, l.lote_estado)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-3 text-sm text-taupe">
          {[l.kilos_totales ? `${l.kilos_totales} kg` : null, l.ubicacion_provincia]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>

        {logueado ? (
          precio != null && (
            <p className="mt-2 font-serif text-lg text-hueso">
              {formatARS(precio)}
              <span className="text-sm text-taupe"> /kg</span>
            </p>
          )
        ) : (
          <p className="mt-2 text-sm text-taupe/70">Precio visible con tu cuenta</p>
        )}

        <span className="mt-auto pt-4 text-xs uppercase tracking-[0.18em] text-salmon">
          Ver lote →
        </span>
      </div>
    </Link>
  );
}
