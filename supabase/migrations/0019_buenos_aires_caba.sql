-- ============================================================================
-- DeCarnes · 0019 · Filtrar "Buenos Aires" incluye CABA
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
-- "Buenos Aires" (provincia) y "Ciudad Autónoma de Buenos Aires" (CABA) son
-- jurisdicciones distintas y el filtro hacía match exacto, así que los lotes de
-- CABA no aparecían al filtrar "Buenos Aires". Se recrean las 3 funciones de
-- catálogo/búsquedas para que "Buenos Aires" incluya también CABA (sin tocar el
-- valor guardado de cada lote). Solo cambia la condición del filtro de provincia.
-- ============================================================================

-- Catálogo público (anónimo) --------------------------------------------------
create or replace function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric, kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg, l.kilos_totales, l.piezas_cajas, l.moq,
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

-- Catálogo interno (autenticado) ----------------------------------------------
create or replace function public.catalogo(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, descripcion text, especie_categoria text,
  lote_estado text, fecha_faena date, precio_pretendido_kg numeric,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, ubicacion_localidad text,
  publicado_hasta date, created_at timestamptz,
  foto_principal text, empresa text, empresa_provincia text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.descripcion, l.especie_categoria,
         l.lote_estado, l.fecha_faena, l.precio_pretendido_kg,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.ubicacion_localidad,
         l.publicado_hasta, l.created_at,
         (l.fotos_paths)[1], coalesce(u.nombre_fantasia, u.razon_social, u.empresa), u.provincia
  from public.lotes l join public.usuarios u on u.id = l.user_id
  where l.publico = true and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia
         or (p_provincia = 'Buenos Aires' and l.ubicacion_provincia = 'Ciudad Autónoma de Buenos Aires'))
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;

-- Búsquedas abiertas ----------------------------------------------------------
create or replace function public.busquedas_abiertas(p_corte text default null, p_provincia text default null)
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text, precio_referencia numeric,
  notas text, comprador_empresa text, es_mia boolean, ofertas_count bigint)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria,
         b.cantidad_kg, b.provincia, b.plazo_necesario, b.precio_referencia,
         b.notas, coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         (b.user_id = auth.uid()),
         case when b.user_id = auth.uid()
              then (select count(*) from public.ofertas o where o.busqueda_id = b.id)
              else null end
  from public.busquedas b join public.usuarios u on u.id = b.user_id
  where b.estado = 'abierta' and auth.uid() is not null
    and (p_corte is null or b.tipo_corte = p_corte)
    and (p_provincia is null or b.provincia = p_provincia
         or (p_provincia = 'Buenos Aires' and b.provincia = 'Ciudad Autónoma de Buenos Aires'))
  order by b.created_at desc limit 200;
$$;
