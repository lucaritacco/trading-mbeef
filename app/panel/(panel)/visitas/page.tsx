import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

const PERIODOS = [
  { h: 24, label: "24 horas" },
  { h: 168, label: "7 días" },
  { h: 720, label: "30 días" },
];

const num = new Intl.NumberFormat("es-AR");

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ h?: string }>;
}) {
  const sp = await searchParams;
  const horas = PERIODOS.some((p) => String(p.h) === sp.h) ? Number(sp.h) : 24;
  const periodo = PERIODOS.find((p) => p.h === horas)!;

  const supabase = await createSupabaseServer();
  const [{ data: res }, { data: paths }, { data: lotesTop }, { data: ev }] = await Promise.all([
    supabase.rpc("visitas_resumen", { p_horas: horas }),
    supabase.rpc("visitas_top_paths", { p_horas: horas, p_limite: 12 }),
    supabase.rpc("visitas_top_lotes", { p_horas: horas, p_limite: 10 }),
    supabase.rpc("eventos_resumen", { p_horas: horas }),
  ]);

  // Funnel de solicitudes. Los nombres técnicos se traducen acá y no en la base,
  // para no atarlos a la interfaz.
  const ETIQUETAS: Record<string, string> = {
    request_created: "Solicitudes creadas",
    request_approved: "Solicitudes publicadas",
    request_view: "Solicitudes vistas",
    request_quote_started: "Empezaron a cotizar",
    request_quote_sent: "Cotizaciones enviadas",
    request_offer_accepted: "Cotizaciones aceptadas",
    request_closed: "Solicitudes cerradas",
    request_share: "Solicitudes compartidas",
    whatsapp_unlocked: "Contactos desbloqueados",
  };
  const eventos = (ev ?? []) as { tipo: string; cantidad: number }[];

  const r = (Array.isArray(res) ? res[0] : null) as {
    vistas_periodo: number;
    vistas_24h: number;
    vistas_7d: number;
    fichas_periodo: number;
  } | null;

  const top = (paths ?? []) as { path: string; vistas: number }[];
  const lotes = (lotesTop ?? []) as {
    lote_id: string;
    titulo: string | null;
    corte: string | null;
    vistas: number;
  }[];

  const total = Number(r?.vistas_periodo ?? 0);

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-texto">Visitas</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto-sec">
        Páginas vistas del sitio público. No se guarda IP ni cookies, así que son
        vistas, no visitantes únicos. No cuenta el panel ni las cuentas.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Link
            key={p.h}
            href={`/panel/visitas?h=${p.h}`}
            className={`border px-3.5 py-1.5 text-xs transition-colors ${
              p.h === horas
                ? "border-primario bg-primario/10 text-texto"
                : "border-borde text-texto-sec hover:border-texto/40 hover:text-texto"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-borde py-6 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">
            En {periodo.label}
          </dt>
          <dd className="mt-1 font-serif text-3xl text-texto">{num.format(total)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Últimas 24 h</dt>
          <dd className="mt-1 font-serif text-3xl text-texto">
            {num.format(Number(r?.vistas_24h ?? 0))}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Últimos 7 días</dt>
          <dd className="mt-1 font-serif text-3xl text-texto">
            {num.format(Number(r?.vistas_7d ?? 0))}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-texto-sec">Fichas de lote</dt>
          <dd className="mt-1 font-serif text-3xl text-texto">
            {num.format(Number(r?.fichas_periodo ?? 0))}
          </dd>
        </div>
      </dl>

      {eventos.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-2xl font-medium text-texto">Funnel de solicitudes</h2>
          <ul className="mt-4 divide-y divide-borde border-y border-borde">
            {eventos.map((e) => (
              <li key={e.tipo} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-texto-sec">{ETIQUETAS[e.tipo] ?? e.tipo}</span>
                <span className="font-serif text-lg text-texto">{num.format(Number(e.cantidad))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {total === 0 ? (
        <p className="mt-12 text-sm text-texto-sec">
          Todavía no hay visitas registradas en este período. El conteo empieza desde
          que se publicó esta función: no hay datos hacia atrás.
        </p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-medium text-texto">Lotes más vistos</h2>
            {lotes.length === 0 ? (
              <p className="mt-4 text-sm text-texto-sec">
                Todavía nadie entró a una ficha de lote en este período.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-borde border-y border-borde">
                {lotes.map((l) => (
                  <li key={l.lote_id} className="flex items-center justify-between gap-4 py-3">
                    <Link
                      href={`/panel/lote/${l.lote_id}`}
                      className="min-w-0 text-sm text-texto hover:text-primario"
                    >
                      <span className="block truncate">{l.titulo ?? l.corte ?? "Lote"}</span>
                      {l.corte && l.titulo && (
                        <span className="block truncate text-xs text-texto-sec">{l.corte}</span>
                      )}
                    </Link>
                    <span className="shrink-0 font-serif text-lg text-texto">
                      {num.format(l.vistas)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-serif text-2xl font-medium text-texto">Páginas más vistas</h2>
            <ul className="mt-4 divide-y divide-borde border-y border-borde">
              {top.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0 truncate text-sm text-texto-sec">{p.path}</span>
                  <span className="shrink-0 font-serif text-lg text-texto">
                    {num.format(p.vistas)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
