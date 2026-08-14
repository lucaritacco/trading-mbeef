-- ============================================================================
-- DeCarnes · 0025 · El precio vuelve a ser público
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
-- Revierte el gating de la 0020: el precio se muestra sin sesión. Lo que queda
-- detrás de la cuenta es CONSULTAR y recibir alertas, no ver.
-- Consecuencia asumida: la competencia y Google ven los precios.
-- ============================================================================

drop function if exists public.catalogo_publico(text, text, text, text);
create function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text,
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.created_at, (l.fotos_paths)[1],
         coalesce(u.verificado, false), u.id,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa), u.foto_path
  from public.lotes l join public.usuarios u on u.id = l.user_id
  where l.publico = true and l.user_id is not null and l.vendido = false
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia
         or (p_provincia = 'Buenos Aires' and l.ubicacion_provincia = 'Ciudad Autónoma de Buenos Aires'))
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;

drop function if exists public.get_ficha_publica(uuid);
create function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, titulo text, corte text, descripcion text,
  tipo_producto text, especie_categoria text, cortes text[], cortes_otro text,
  kilos_totales numeric, piezas_cajas integer, moq numeric, modalidad_entrega text,
  precio_pretendido_kg numeric,
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text,
  observaciones_calidad text, fotos_paths text[],
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
         l.precio_pretendido_kg,
         l.lote_estado, l.envasado_tipo, l.envasado_marca, l.certificados,
         l.fecha_faena, l.fecha_vencimiento, l.ubicacion_provincia,
         l.observaciones_calidad, l.fotos_paths,
         coalesce(u.verificado, false), u.id,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa), u.foto_path
  from public.lotes l left join public.usuarios u on u.id = l.user_id
  where l.id = p_id and l.publico = true and l.vendido = false;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

drop function if exists public.lotes_de_vendedor(uuid);
create function public.lotes_de_vendedor(p_id uuid)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text,
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.created_at, (l.fotos_paths)[1],
         coalesce(u.verificado, false), u.id,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa), u.foto_path
  from public.lotes l join public.usuarios u on u.id = l.user_id
  where l.user_id = p_id and l.publico = true and l.vendido = false
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
  order by l.created_at desc limit 200;
$$;
revoke all on function public.lotes_de_vendedor(uuid) from public;
grant execute on function public.lotes_de_vendedor(uuid) to anon, authenticated;
