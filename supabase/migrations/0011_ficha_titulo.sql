-- ============================================================================
-- DeCarnes · 0011 · La ficha pública trae título/corte/descripción del lote
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- get_ficha_publica() se creó antes del formulario de mercado (tanda 4), así que
-- no devolvía titulo/corte/descripcion/moq/modalidad/certificados. Se recrea con
-- esos campos (sigue siendo solo columnas comerciales, sin datos del dueño).
-- ============================================================================

drop function if exists public.get_ficha_publica(uuid);

create function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, titulo text, corte text, descripcion text,
  tipo_producto text, especie_categoria text, cortes text[], cortes_otro text,
  kilos_totales numeric, piezas_cajas integer, moq numeric, modalidad_entrega text,
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text, ubicacion_localidad text,
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select id, created_at, titulo, corte, descripcion,
         tipo_producto, especie_categoria, cortes, cortes_otro,
         kilos_totales, piezas_cajas, moq, modalidad_entrega,
         lote_estado, envasado_tipo, envasado_marca, certificados,
         fecha_faena, fecha_vencimiento, ubicacion_provincia, ubicacion_localidad,
         observaciones_calidad, fotos_paths
  from public.lotes
  where id = p_id and publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;
