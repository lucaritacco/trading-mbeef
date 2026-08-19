import Link from "next/link";

// Datos públicos de una solicitud (solicitudes_publicas / solicitud_publica).
// Nunca trae comprador, empresa ni contacto: la anonimización está en la base.
export type SolicitudPublica = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
  ofertas_count?: number | null;
};

const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** "hace 2 h", "hoy", "hace 3 d": da señal de actividad sin fecha exacta. */
export function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min <= 1 ? "recién" : `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.floor(d / 30);
  return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
}

// Card de demanda. Es el espejo de LoteCard (oferta), con la misma jerarquía:
// etiqueta, título, dato fuerte, contexto y una acción.
export default function SolicitudCard({ s }: { s: SolicitudPublica }) {
  const ofertas = Number(s.ofertas_count ?? 0);

  return (
    <Link
      href={`/solicitudes/${s.id}`}
      className="group flex flex-col border border-borde bg-superficie p-5 transition-colors hover:border-primario"
    >
      <div className="flex items-center gap-2">
        <span className="bg-tinta px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-superficie">
          Busco
        </span>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-exito">
          <span className="h-1.5 w-1.5 rounded-full bg-exito" aria-hidden="true" />
          Activa
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-medium leading-snug text-texto transition-colors group-hover:text-primario">
        {s.tipo_corte ?? "Corte a definir"}
      </h3>
      {s.especie_categoria && (
        <p className="mt-1 text-sm text-texto-sec">{s.especie_categoria}</p>
      )}

      <p className="mt-4 font-serif text-2xl text-texto">
        {s.cantidad_kg != null ? `${kg.format(s.cantidad_kg)} kg` : "Cantidad a definir"}
      </p>

      <dl className="mt-3 space-y-1 text-sm text-texto-sec">
        {s.provincia && <div>{s.provincia}</div>}
        {s.plazo_necesario && <div>{s.plazo_necesario}</div>}
      </dl>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-borde pt-4 text-xs">
        <span className="text-texto-sec">
          {haceCuanto(s.created_at)}
          {ofertas > 0 && ` · ${ofertas} cotizacion${ofertas === 1 ? "" : "es"}`}
        </span>
        <span className="font-medium text-primario">Ver solicitud →</span>
      </div>
    </Link>
  );
}
