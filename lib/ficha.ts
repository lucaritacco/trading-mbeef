import { cache } from "react";
import { supabase } from "./supabase";

// Datos comerciales seguros de un lote público (los que devuelve get_ficha_publica).
export type FichaPublica = {
  id: string;
  created_at: string;
  tipo_producto: string | null;
  especie_categoria: string | null;
  cortes: string[] | null;
  cortes_otro: string | null;
  kilos_totales: number | null;
  piezas_cajas: number | null;
  lote_estado: string | null;
  envasado_tipo: string | null;
  envasado_marca: string | null;
  fecha_faena: string | null;
  fecha_vencimiento: string | null;
  ubicacion_provincia: string | null;
  ubicacion_localidad: string | null;
  observaciones_calidad: string | null;
  fotos_paths: string[] | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trae la ficha pública por id (solo lotes marcados publico=true). cache() dedup por request. */
export const getFicha = cache(async (id: string): Promise<FichaPublica | null> => {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await supabase.rpc("get_ficha_publica", { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as FichaPublica;
});

/** Firma una URL temporal para una foto de un lote público (bucket privado). */
export const firmarFoto = cache(async (path: string): Promise<string | null> => {
  const { data } = await supabase.storage
    .from("lotes-fotos")
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 días
  return data?.signedUrl ?? null;
});
