-- ============================================================================
-- DeCarnes · 0015 · Perfil público del vendedor + sus lotes + badge en la ficha
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
--   · perfil_vendedor: datos comerciales del vendedor (SIN cuit/whatsapp/habilitación).
--   · lotes_de_vendedor: sus lotes públicos (misma forma que catalogo_publico).
--   · get_ficha_publica: suma vendedor_id + vendedor_nombre para el badge de la ficha.
-- Todo para anon (es la vidriera pública). Nada sensible del dueño se expone.
-- ============================================================================

-- 1) Perfil público del vendedor (nombre comercial, ubicación, rol y # de lotes).
create or replace function public.perfil_vendedor(p_id uuid)
returns table (
  id uuid, nombre text, provincia text, localidad text, rol_mercado text, cant_lotes bigint
)
language sql security definer set search_path = public stable as $$
  select u.id,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa) as nombre,
         u.provincia, u.localidad, u.rol_mercado,
         (select count(*) from public.lotes l
           where l.user_id = u.id and l.publico = true
             and (l.publicado_hasta is null or l.publicado_hasta >= current_date)) as cant_lotes
  from public.usuarios u
  where u.id = p_id
    and u.estado = 'activo'
    and coalesce(u.nombre_fantasia, u.razon_social, u.empresa) is not null
  limit 1;
$$;
revoke all on function public.perfil_vendedor(uuid) from public;
grant execute on function public.perfil_vendedor(uuid) to anon, authenticated;

-- 2) Lotes públicos de un vendedor (mismas columnas que catalogo_publico).
create or replace function public.lotes_de_vendedor(p_id uuid)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric, kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, ubicacion_localidad text, created_at timestamptz, foto_principal text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg, l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.ubicacion_localidad, l.created_at, (l.fotos_paths)[1]
  from public.lotes l
  where l.user_id = p_id and l.publico = true
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
  order by l.created_at desc limit 200;
$$;
revoke all on function public.lotes_de_vendedor(uuid) from public;
grant execute on function public.lotes_de_vendedor(uuid) to anon, authenticated;

-- 3) get_ficha_publica: suma la identidad pública del vendedor (para el badge).
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
  observaciones_calidad text, fotos_paths text[],
  vendedor_id uuid, vendedor_nombre text
)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
         l.precio_pretendido_kg,
         l.lote_estado, l.envasado_tipo, l.envasado_marca, l.certificados,
         l.fecha_faena, l.fecha_vencimiento, l.ubicacion_provincia, l.ubicacion_localidad,
         l.observaciones_calidad, l.fotos_paths,
         l.user_id as vendedor_id,
         (select coalesce(u.nombre_fantasia, u.razon_social, u.empresa)
            from public.usuarios u where u.id = l.user_id) as vendedor_nombre
  from public.lotes l
  where l.id = p_id and l.publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;
