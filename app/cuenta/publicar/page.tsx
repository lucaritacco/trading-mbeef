import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import PublicarLoteForm from "@/components/cuenta/PublicarLoteForm";
import { LOTE_VACIO, type LoteForm } from "@/lib/mercado";
import { firmarFoto } from "@/lib/ficha";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publicar lote | DeCarnes",
  robots: { index: false, follow: false },
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

// Publicar exige verificación (RLS "lotes vendedor insert"). Se avisa acá, antes
// de que el vendedor cargue todo el formulario y choque con un error de permisos.
async function puedePublicar(): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("mi_estado_cuenta");
  const fila = Array.isArray(data) ? data[0] : null;
  return Boolean(fila?.verificado);
}

function EnVerificacion() {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.24em] text-primario">Mercado</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">
        Tu cuenta está en verificación
      </h1>
      <p className="mt-5 leading-relaxed text-texto-sec">
        Antes de publicar revisamos los datos de cada frigorífico y hablamos con vos.
        Es lo que sostiene el sello de verificado que ven los compradores en cada lote.
      </p>
      <p className="mt-4 leading-relaxed text-texto-sec">
        Te avisamos apenas esté lista. Si necesitás apurarlo, escribinos.
      </p>
      <a
        href={site.whatsappVenderHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
      >
        Hablar con el equipo
      </a>
    </div>
  );
}

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!(await puedePublicar())) return <EnVerificacion />;

  if (!id) {
    return <PublicarLoteForm />;
  }

  // Edición: solo lotes propios (RLS own select).
  const supabase = await createSupabaseServer();
  const { data: l } = await supabase.from("lotes").select("*").eq("id", id).maybeSingle();
  if (!l) notFound();

  const initial: LoteForm = {
    ...LOTE_VACIO,
    titulo: str(l.titulo),
    corte: str(l.corte),
    descripcion: str(l.descripcion),
    especie_categoria: str(l.especie_categoria),
    lote_estado: str(l.lote_estado),
    fecha_faena: str(l.fecha_faena),
    fecha_vencimiento: str(l.fecha_vencimiento),
    disponibilidad_desde: str(l.disponibilidad_desde),
    precio_pretendido_kg: str(l.precio_pretendido_kg),
    modalidad_entrega: str(l.modalidad_entrega),
    ubicacion_provincia: str(l.ubicacion_provincia),
    ubicacion_localidad: str(l.ubicacion_localidad),
    kilos_totales: str(l.kilos_totales),
    piezas_cajas: str(l.piezas_cajas),
    moq: str(l.moq),
    vigencia_dias: str(l.vigencia_dias),
    envasado_tipo: str(l.envasado_tipo),
    certificados: Array.isArray(l.certificados) ? l.certificados : [],
  };

  const paths: string[] = Array.isArray(l.fotos_paths) ? l.fotos_paths : [];
  const fotosExistentes = await Promise.all(
    paths.map(async (p) => ({ path: p, url: await firmarFoto(p) })),
  );

  return (
    <PublicarLoteForm loteId={l.id} initial={initial} fotosExistentes={fotosExistentes} />
  );
}
