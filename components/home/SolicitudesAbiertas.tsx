import Link from "next/link";

export type SolicitudPublica = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
};

const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// Vitrina de demanda: le muestra al frigorífico que hay compradores buscando.
// Es anónima a propósito (sin comprador ni notas): el contacto se abre recién
// cuando el comprador acepta una oferta, dentro de la cuenta.
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

  return (
    <section className="border-y border-borde bg-superficie">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primario">
              Lo que están buscando
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.9rem)] font-medium leading-tight text-texto">
              {total === 1 ? "Hay una solicitud abierta." : `Hay ${total} solicitudes abiertas.`}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-texto-sec">
              Compradores publicando lo que necesitan. Si tenés el stock, cotizás y
              el comprador compara.
            </p>
          </div>
          <Link
            href={logueado ? "/cuenta/busquedas" : "/vendedores"}
            className="text-sm font-medium text-primario underline-offset-4 transition-colors hover:underline"
          >
            {logueado ? "Ver todas y cotizar →" : "Quiero responder solicitudes →"}
          </Link>
        </div>

        <ul className="mt-9 divide-y divide-borde border-y border-borde">
          {solicitudes.map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
              <span className="font-serif text-lg font-medium text-texto">
                {s.tipo_corte ?? "Corte a definir"}
              </span>
              {s.cantidad_kg != null && (
                <span className="text-sm text-texto">{kg.format(s.cantidad_kg)} kg</span>
              )}
              <span className="text-sm text-texto-sec">
                {[s.especie_categoria, s.provincia].filter(Boolean).join(" · ")}
              </span>
              {s.plazo_necesario && (
                <span className="ml-auto text-xs uppercase tracking-[0.14em] text-texto-sec">
                  {s.plazo_necesario}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
