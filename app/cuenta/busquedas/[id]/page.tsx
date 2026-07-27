import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { cerrarBusqueda } from "@/app/cuenta/actions";
import EnviarOfertaForm from "@/components/cuenta/EnviarOfertaForm";
import OfertasComprador from "@/components/cuenta/OfertasComprador";
import { formatARS, formatFecha } from "@/lib/panel";
import type { BusquedaDetalle, OfertaFila } from "@/lib/busquedas";

export const metadata: Metadata = {
  title: "Búsqueda | DeCarnes",
  robots: { index: false, follow: false },
};

const ESTADO_BADGE: Record<string, string> = {
  enviada: "border-hueso/25 text-taupe",
  aceptada: "border-verde-claro/50 text-verde-claro",
  rechazada: "border-rojo/40 text-rojo-claro",
};

export default async function BusquedaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: bData } = await supabase.rpc("busqueda_ver", { p_id: id });
  const b = (Array.isArray(bData) ? bData[0] : null) as BusquedaDetalle | null;
  if (!b) notFound();

  const { data: oData } = await supabase.rpc("ofertas_de_busqueda", { p_busqueda_id: id });
  const ofertas = (oData ?? []) as OfertaFila[];

  const abierta = b.estado === "abierta";

  return (
    <div className="max-w-4xl">
      <Link href="/cuenta/busquedas" className="text-sm text-taupe transition-colors hover:text-hueso">
        ← Búsquedas
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">
            Búsqueda {b.es_mia ? "· tuya" : ""}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-hueso sm:text-4xl">
            {b.tipo_corte ?? "Búsqueda"}
          </h1>
          <p className="mt-2 text-taupe">
            {[b.especie_categoria, b.cantidad_kg ? `${b.cantidad_kg} kg` : null, b.provincia]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className={`border px-3 py-1 text-xs ${abierta ? "border-verde-claro/50 text-verde-claro" : "border-hueso/25 text-taupe"}`}>
          {abierta ? "Abierta" : "Cerrada"}
        </span>
      </div>

      {/* Datos de la búsqueda */}
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-hueso/10 pt-8 sm:grid-cols-3">
        <Dato label="Comprador" value={b.comprador_empresa} />
        <Dato label="Cantidad" value={b.cantidad_kg ? `${b.cantidad_kg} kg` : null} />
        <Dato label="Zona" value={b.provincia} />
        <Dato label="Plazo" value={b.plazo_necesario} />
        <Dato label="Precio de referencia" value={b.precio_referencia != null ? `${formatARS(b.precio_referencia)}/kg` : null} />
        <Dato label="Publicada" value={formatFecha(b.created_at)} />
      </dl>
      {b.notas && (
        <p className="mt-6 border-t border-hueso/10 pt-6 leading-relaxed text-taupe">{b.notas}</p>
      )}

      {/* Vista COMPRADOR (dueño): comparar ofertas */}
      {b.es_mia ? (
        <div className="mt-10 border-t border-hueso/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-medium text-hueso">
              Ofertas recibidas ({ofertas.length})
            </h2>
            {abierta && (
              <form action={cerrarBusqueda}>
                <input type="hidden" name="id" value={b.id} />
                <button className="border border-hueso/25 px-4 py-2 text-sm text-taupe transition-colors hover:border-rojo hover:text-rojo-claro">
                  Cerrar búsqueda
                </button>
              </form>
            )}
          </div>
          <div className="mt-6">
            <OfertasComprador ofertas={ofertas} abierta={abierta} />
          </div>
        </div>
      ) : (
        /* Vista VENDEDOR: enviar oferta + ver las propias */
        <div className="mt-10 grid gap-8 border-t border-hueso/10 pt-8 lg:grid-cols-2">
          <div>
            {abierta ? (
              <EnviarOfertaForm busquedaId={b.id} />
            ) : (
              <p className="border border-hueso/15 bg-carbon/40 p-6 text-sm text-taupe">
                Esta búsqueda está cerrada: ya no recibe ofertas.
              </p>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-hueso">Tus ofertas a esta búsqueda</h2>
            {ofertas.length === 0 ? (
              <p className="mt-3 text-sm text-taupe">Todavía no enviaste ninguna oferta.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ofertas.map((o) => (
                  <li key={o.id} className="border border-hueso/15 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg text-hueso">
                        {o.precio_por_kg != null ? `${formatARS(o.precio_por_kg)}/kg` : "—"}
                      </span>
                      <span className={`border px-2 py-0.5 text-xs ${ESTADO_BADGE[o.estado] ?? "text-taupe"}`}>
                        {o.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-taupe">
                      {[o.cantidad_ofrecida_kg ? `${o.cantidad_ofrecida_kg} kg` : null, o.plazo_entrega]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {o.estado === "aceptada" && (
                      <p className="mt-2 text-xs text-verde-claro">
                        ¡Te la aceptaron! El comprador te va a contactar por WhatsApp.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">{label}</dt>
      <dd className="mt-1 text-sm text-hueso">{value}</dd>
    </div>
  );
}
