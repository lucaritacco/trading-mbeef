import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import LoteInterno from "@/components/panel/LoteInterno";
import {
  CONFIG_DEFAULT,
  formatARS,
  formatFecha,
  type Config,
  type Lote,
} from "@/lib/panel";

async function signedUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">{label}</dt>
      <dd className="mt-1 text-sm text-hueso">{value ?? "—"}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border border-hueso/10 p-6">
      <h2 className="mb-5 font-serif text-xl font-medium text-hueso">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function LoteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: configRow } = await supabase.from("config").select("*").maybeSingle();
  const config: Config = configRow ?? CONFIG_DEFAULT;

  const { data } = await supabase.from("lotes").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as Lote;

  const fotos = await Promise.all(
    (l.fotos_paths ?? []).map((p) => signedUrl(supabase, "lotes-fotos", p)),
  );
  const docAfip = await signedUrl(supabase, "documentos", l.archivo_afip_path);
  const docHab = await signedUrl(supabase, "documentos", l.archivo_habilitacion_path);
  const certs = await Promise.all(
    (l.archivos_certificaciones_paths ?? []).map((p) => signedUrl(supabase, "documentos", p)),
  );

  const wpp = l.contacto_telefono ? l.contacto_telefono.replace(/\D/g, "") : null;

  return (
    <div>
      <Link href="/panel" className="text-sm text-taupe transition-colors hover:text-hueso">← Volver a lotes</Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl font-medium text-hueso">
          {l.especie_categoria ?? l.tipo_producto ?? "Lote"}
        </h1>
        <span className="font-mono text-xs text-taupe">{l.id}</span>
      </div>
      <p className="mt-1 text-sm text-taupe">Ingresó el {formatFecha(l.created_at)}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Columna izquierda: datos del lote */}
        <div className="space-y-6">
          <Seccion titulo="El lote">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato label="Tipo" value={l.tipo_producto} />
              <Dato label="Especie / categoría" value={l.especie_categoria} />
              <Dato label="Estado" value={l.lote_estado} />
              <Dato label="Kilos" value={l.kilos_totales} />
              <Dato label="Piezas / cajas" value={l.piezas_cajas} />
              <Dato label="Envasado" value={[l.envasado_tipo, l.envasado_marca].filter(Boolean).join(" · ") || null} />
              <Dato label="Faena" value={formatFecha(l.fecha_faena)} />
              <Dato label="Vencimiento" value={formatFecha(l.fecha_vencimiento)} />
              <Dato label="Ubicación" value={[l.ubicacion_localidad, l.ubicacion_provincia].filter(Boolean).join(", ") || null} />
              <Dato label="Cortes" value={[...(l.cortes ?? []), l.cortes_otro].filter(Boolean).join(", ") || null} />
            </dl>
            {l.observaciones_calidad && (
              <p className="mt-5 border-t border-hueso/10 pt-4 text-sm text-taupe">{l.observaciones_calidad}</p>
            )}
          </Seccion>

          <Seccion titulo="Condiciones pretendidas">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato label="Pretendido / kg" value={formatARS(l.precio_pretendido_kg)} />
              <Dato label="Pago" value={l.condicion_pago} />
              <Dato label="Disponible desde" value={formatFecha(l.disponibilidad_desde)} />
              <Dato label="Flete" value={l.necesita_flete} />
              <Dato label="Preferencia" value={l.preferencia_operacion} />
            </dl>
          </Seccion>

          {fotos.some(Boolean) && (
            <Seccion titulo="Fotos">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fotos.filter(Boolean).map((u, i) => (
                  <a key={i} href={u!} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden border border-hueso/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u!} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </Seccion>
          )}

          <Seccion titulo={`Legajo · ${l.legajo_estado === "completo" ? "Completo" : "Pendiente"}`}>
            {l.legajo_estado === "completo" ? (
              <>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <Dato label="Razón social" value={l.razon_social} />
                  <Dato label="Nombre fantasía" value={l.nombre_fantasia} />
                  <Dato label="RUCA" value={[l.ruca_numero, l.ruca_categoria].filter(Boolean).join(" · ") || null} />
                  <Dato label="Habilitación" value={[l.habilitacion_tipo, l.habilitacion_numero].filter(Boolean).join(" · ") || null} />
                  <Dato label="Empresa" value={[l.empresa_localidad, l.empresa_provincia].filter(Boolean).join(", ") || null} />
                  <Dato label="Decl. jurada" value={l.declaracion_jurada ? "Sí" : "No"} />
                </dl>
                {l.referencias_comerciales && (
                  <p className="mt-5 border-t border-hueso/10 pt-4 text-sm text-taupe">{l.referencias_comerciales}</p>
                )}
                <div className="mt-5 flex flex-wrap gap-3 border-t border-hueso/10 pt-4">
                  {docAfip && <DocLink href={docAfip} label="Constancia AFIP" />}
                  {docHab && <DocLink href={docHab} label="Habilitación" />}
                  {certs.filter(Boolean).map((u, i) => (
                    <DocLink key={i} href={u!} label={`Certificación ${i + 1}`} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-taupe">
                El proveedor todavía no completó el legajo. Podés invitarlo con el
                link <span className="font-mono text-xs text-hueso">/publicar/legajo/{l.id}</span>.
              </p>
            )}
          </Seccion>
        </div>

        {/* Columna derecha: contacto + panel interno */}
        <div className="space-y-6">
          <Seccion titulo="Contacto">
            <dl className="space-y-4">
              <Dato label="Nombre" value={l.contacto_nombre} />
              <Dato label="CUIT" value={l.cuit} />
              <Dato
                label="WhatsApp"
                value={
                  wpp ? (
                    <a href={`https://wa.me/${wpp}`} target="_blank" rel="noopener noreferrer" className="text-rojo-claro hover:text-hueso">
                      {l.contacto_telefono}
                    </a>
                  ) : null
                }
              />
              <Dato label="Email" value={l.contacto_email} />
            </dl>
          </Seccion>

          <div className="border border-hueso/10 p-6">
            <h2 className="mb-5 font-serif text-xl font-medium text-hueso">Análisis y oferta</h2>
            <LoteInterno lote={l} config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-hueso/20 px-3 py-2 text-xs text-hueso transition-colors hover:border-bordo">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-salmon" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}
