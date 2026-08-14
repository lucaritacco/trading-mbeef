import { cache } from "react";
import { supabase } from "./supabase";

// Datos comerciales seguros de un lote público (los que devuelve get_ficha_publica).
export type FichaPublica = {
  id: string;
  created_at: string;
  titulo: string | null;
  corte: string | null;
  descripcion: string | null;
  tipo_producto: string | null;
  especie_categoria: string | null;
  cortes: string[] | null;
  cortes_otro: string | null;
  kilos_totales: number | null;
  piezas_cajas: number | null;
  moq: number | null;
  modalidad_entrega: string | null;
  // Nota: el precio ya NO viaja en la ficha pública (queda detrás del login).
  // Se pide aparte con precios_lotes() para usuarios logueados.
  lote_estado: string | null;
  envasado_tipo: string | null;
  envasado_marca: string | null;
  certificados: string[] | null;
  fecha_faena: string | null;
  fecha_vencimiento: string | null;
  ubicacion_provincia: string | null;
  observaciones_calidad: string | null;
  fotos_paths: string[] | null;
  /** Sello del frigorífico (usuarios.verificado). Booleano: no lo identifica. */
  verificado: boolean;
};

// Fila de lote para tarjetas de catálogo (catalogo_publico). Sin datos del dueño,
// sin localidad y SIN precio: el precio se sirve aparte solo a logueados.
export type LoteFila = {
  id: string;
  titulo: string | null;
  corte: string | null;
  especie_categoria: string | null;
  lote_estado: string | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  foto_principal: string | null;
  /** Sello del frigorífico (usuarios.verificado). Booleano: no lo identifica. */
  verificado: boolean;
};

// Métrica de volumen del mercado (para el hero). Se calcula en vivo.
export type MetricaMercado = { lotes_activos: number; kilos_totales: number };

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

/**
 * Precios de una lista de lotes, SOLO si hay sesión (anon recibe {} siempre:
 * la función precios_lotes está revocada para anon). Devuelve un mapa id→precio;
 * los lotes sin precio cargado simplemente no aparecen en el mapa.
 */
export async function getPrecios(
  supabaseCliente: typeof supabase,
  ids: string[],
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (ids.length === 0) return mapa;
  const { data, error } = await supabaseCliente.rpc("precios_lotes", { p_ids: ids });
  if (error || !data) return mapa;
  for (const fila of data as { id: string; precio: number | null }[]) {
    if (fila.precio != null) mapa.set(fila.id, fila.precio);
  }
  return mapa;
}

/** Métrica de volumen del mercado (lotes activos + kg totales), en vivo. */
export const getMetricas = cache(async (): Promise<MetricaMercado | null> => {
  const { data, error } = await supabase.rpc("metricas_mercado");
  const fila = Array.isArray(data) ? data[0] : null;
  if (error || !fila) return null;
  return { lotes_activos: Number(fila.lotes_activos ?? 0), kilos_totales: Number(fila.kilos_totales ?? 0) };
});
