import Link from "next/link";
import SolicitudCard, { type SolicitudPublica } from "@/components/SolicitudCard";

export type { SolicitudPublica };

// Bloque de demanda en la home. Habla a los dos lados a la vez: le muestra al
// frigorífico que hay compradores buscando, y al comprador que puede pedir lo
// que necesita. Se oculta solo si no hay solicitudes aprobadas.
export default function SolicitudesAbiertas({
  solicitudes,
  total,
  logueado,
}: {
  solicitudes: SolicitudPublica[];
  total: number;
  logueado: boolean;
}) {
  if (solicitudes.length === 0) return null;

  const publicar = logueado
    ? "/cuenta/busquedas/nueva"
    : "/registro?next=/cuenta/busquedas/nueva";

  return (
    <section className="border-y border-borde bg-superficie">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Demanda</p>
            <h2 className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.9rem)] font-medium leading-tight text-texto">
              Lo que están buscando
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-texto-sec">
              Demanda mayorista activa en DeCarnes.
              {total > solicitudes.length && ` ${total} solicitudes abiertas.`}
            </p>
          </div>
          <Link
            href="/solicitudes"
            className="text-sm font-medium text-primario underline-offset-4 transition-colors hover:underline"
          >
            Ver todas las solicitudes →
          </Link>
        </div>

        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solicitudes.slice(0, 3).map((s) => (
            <SolicitudCard key={s.id} s={s} />
          ))}
        </div>

        {/* Cierre para el comprador: el otro lado del mismo bloque */}
        <div className="mt-8 flex flex-col gap-4 border border-borde bg-fondo px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-lg font-medium text-texto">
              ¿No encontraste lo que necesitás?
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-texto-sec">
              Publicá una solicitud y recibí cotizaciones de frigoríficos registrados.
            </p>
          </div>
          <Link
            href={publicar}
            className="shrink-0 self-start bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover sm:self-auto"
          >
            Solicitar cotización
          </Link>
        </div>
      </div>
    </section>
  );
}
