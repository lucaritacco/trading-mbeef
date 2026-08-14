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
  precio_pretendido_kg: number | null;
  lote_estado: string | null;
  envasado_tipo: string | null;
  envasado_marca: string | null;
  certificados: string[] | null;
  fecha_faena: string | null;
  fecha_vencimiento: string | null;
  ubicacion_provincia: string | null;
  observaciones_calidad: string | null;
  fotos_paths: string[] | null;
  verificado: boolean;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  vendedor_foto: string | null;
};

// Fila de lote para tarjetas de catálogo (catalogo_publico). Sin datos del dueño,
// sin localidad y SIN precio: el precio se sirve aparte solo a logueados.
export type LoteFila = {
  id: string;
  titulo: string | null;
  corte: string | null;
  especie_categoria: string | null;
  lote_estado: string | null;
  precio_pretendido_kg: number | null;
  kilos_totales: number | null;
  ubicacion_provincia: string | null;
  foto_principal: string | null;
  verificado: boolean;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  vendedor_foto: string | null;
};

// Métrica de volumen del mercado (para el hero). Se calcula en vivo.
export type MetricaMercado = { lotes_activos: number; kilos_totales: number };

/**
 * URL de la foto de perfil del frigorífico. El bucket `perfiles` es público, así
 * que la URL es directa: no hace falta firmarla en cada tarjeta del catálogo.
 */
export function fotoPerfil(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/perfiles/${path}` : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trae la ficha pública por id (solo lotes marcados publico=true). cache() dedup por request. */
export const getFicha = cache(async (id: string): Promise<FichaPublica | null> => {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await supabase.rpc("get_ficha_publica", { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as FichaPublica;
});

// Perfil público del frigorífico (identidad comercial, sin datos de contacto).
export type PerfilVendedor = {
  id: string;
  nombre: string | null;
  foto_path: string | null;
  descripcion: string | null;
  provincia: string | null;
  verificado: boolean;
  cant_lotes: number | null;
};

export const getPerfilVendedor = cache(async (id: string): Promise<PerfilVendedor | null> => {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await supabase.rpc("perfil_vendedor", { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as PerfilVendedor;
});

export const getLotesVendedor = cache(async (id: string): Promise<LoteFila[]> => {
  if (!UUID_RE.test(id)) return [];
  const { data, error } = await supabase.rpc("lotes_de_vendedor", { p_id: id });
  if (error || !data) return [];
  return data as LoteFila[];
});

/** Firma una URL temporal para una foto de un lote público (bucket privado). */
export const firmarFoto = cache(async (path: string): Promise<string | null> => {
  const { data } = await supabase.storage
    .from("lotes-fotos")
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 días
  return data?.signedUrl ?? null;
});

