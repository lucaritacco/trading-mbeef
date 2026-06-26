import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import PublicarLoteForm from "@/components/cuenta/PublicarLoteForm";
import { LOTE_VACIO, type LoteForm } from "@/lib/mercado";

export const metadata: Metadata = {
  title: "Publicar lote | DeCarnes",
  robots: { index: false, follow: false },
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

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

  return (
    <PublicarLoteForm
      loteId={l.id}
      initial={initial}
      fotosExistentes={Array.isArray(l.fotos_paths) ? l.fotos_paths : []}
    />
  );
}
