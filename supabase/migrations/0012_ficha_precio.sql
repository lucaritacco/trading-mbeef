-- ============================================================================
-- DeCarnes · 0012 · La ficha pública devuelve el precio por kg
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos, NO cambia permisos. Pegar en Supabase → SQL Editor → Run.
-- El precio ya es público (se muestra en /mercado vía catalogo_publico); acá se
-- suma a get_ficha_publica para mostrarlo también en la ficha. Sigue siendo solo
-- columnas comerciales, sigue habilitada para anon+authenticated (sin abrir nada).
-- ============================================================================

drop function if exists public.get_ficha_publica(uuid);

create function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, titulo text, corte text, descripcion text,
  tipo_producto text, especie_categoria text, cortes text[], cortes_otro text,
  kilos_totales numeric, piezas_cajas integer, moq numeric, modalidad_entrega text,
  precio_pretendido_kg numeric,
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text, ubicacion_localidad text,
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select id, created_at, titulo, corte, descripcion,
         tipo_producto, especie_categoria, cortes, cortes_otro,
         kilos_totales, piezas_cajas, moq, modalidad_entrega,
         precio_pretendido_kg,
         lote_estado, envasado_tipo, envasado_marca, certificados,
         fecha_faena, fecha_vencimiento, ubicacion_provincia, ubicacion_localidad,
         observaciones_calidad, fotos_paths
  from public.lotes
  where id = p_id and publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;
