-- ============================================================================
-- DeCarnes · 0020 · Precio detrás del login + métricas del mercado
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Modelo marketplace v4 (estilo MeatBorsa): las tarjetas y la ficha son públicas
-- e indexables (corte, kg, categoría, estado, zona, fotos), pero el PRECIO queda
-- detrás del login (no se expone a la competencia). Por eso las funciones públicas
-- dejan de devolver precio_pretendido_kg, y el precio se sirve aparte solo a
-- usuarios logueados. Además se agrega una métrica de volumen para el hero.
-- ============================================================================

-- 1) Ficha pública SIN precio (todo lo demás igual: producto + provincia).
drop function if exists public.get_ficha_publica(uuid);
create function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, titulo text, corte text, descripcion text,
  tipo_producto text, especie_categoria text, cortes text[], cortes_otro text,
  kilos_totales numeric, piezas_cajas integer, moq numeric, modalidad_entrega text,
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text,
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
         l.lote_estado, l.envasado_tipo, l.envasado_marca, l.certificados,
         l.fecha_faena, l.fecha_vencimiento, l.ubicacion_provincia,
         l.observaciones_calidad, l.fotos_paths
  from public.lotes l
  where l.id = p_id and l.publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- 2) Catálogo público SIN precio (mantiene el filtro Buenos Aires+CABA de la 0019).
drop function if exists public.catalogo_publico(text, text, text, text);
create function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.created_at, (l.fotos_paths)[1]
  from public.lotes l
  where l.publico = true and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia
         or (p_provincia = 'Buenos Aires' and l.ubicacion_provincia = 'Ciudad Autónoma de Buenos Aires'))
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
revoke execute on function public.catalogo_publico(text, text, text, text) from anon;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;

-- 3) Precios SOLO para logueados: la ficha (1 id) y las tarjetas (varios) piden acá.
create or replace function public.precios_lotes(p_ids uuid[])
returns table (id uuid, precio numeric)
language sql security definer set search_path = public stable as $$
  select l.id, l.precio_pretendido_kg
  from public.lotes l
  where l.id = any(p_ids) and l.publico = true;
$$;
revoke all on function public.precios_lotes(uuid[]) from public;
revoke execute on function public.precios_lotes(uuid[]) from anon;
grant execute on function public.precios_lotes(uuid[]) to authenticated;

-- 4) Métrica de volumen del mercado (para el hero). Pública, sin datos sensibles.
create or replace function public.metricas_mercado()
returns table (lotes_activos bigint, kilos_totales numeric)
language sql security definer set search_path = public stable as $$
  select count(*)::bigint, coalesce(sum(l.kilos_totales), 0)
  from public.lotes l
  where l.publico = true and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date);
$$;
revoke all on function public.metricas_mercado() from public;
grant execute on function public.metricas_mercado() to anon, authenticated;
