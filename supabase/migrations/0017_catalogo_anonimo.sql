-- ============================================================================
-- DeCarnes · 0017 · Catálogo/ficha públicos ANÓNIMOS (proveedor bajo MBEEF)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos, NO cambia permisos de tablas ni RLS. Pegar en
-- Supabase → SQL Editor → Run.
--
-- Cambio de identidad: en público los lotes NO identifican al frigorífico. Las
-- funciones públicas dejan de devolver CUALQUIER dato del dueño (user_id, empresa,
-- cuit, contacto) y también la LOCALIDAD (permite identificar). Solo producto +
-- provincia. Internamente NADA cambia: los lotes siguen atados a su user_id y el
-- panel de staff sigue viendo el proveedor (usa otras funciones, no estas).
--
-- Nota de privilegios: no se agregan grants. get_ficha_publica y catalogo_publico
-- ya eran anon+authenticated. Solo se recortan columnas. Se ELIMINAN las funciones
-- perfil_vendedor/lotes_de_vendedor (tanda 15) porque exponían al frigorífico.
-- ============================================================================

-- 1) Ficha pública: solo datos del producto + provincia. Sin vendedor ni localidad.
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
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
         l.precio_pretendido_kg,
         l.lote_estado, l.envasado_tipo, l.envasado_marca, l.certificados,
         l.fecha_faena, l.fecha_vencimiento, l.ubicacion_provincia,
         l.observaciones_calidad, l.fotos_paths
  from public.lotes l
  where l.id = p_id and l.publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- 2) Catálogo público: idem, sin localidad (ya no devolvía empresa ni user_id).
drop function if exists public.catalogo_publico(text, text, text, text);
create function public.catalogo_publico(
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
    and (p_provincia is null or l.ubicacion_provincia = p_provincia)
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
revoke execute on function public.catalogo_publico(text, text, text, text) from anon;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;

-- 3) Eliminar la vidriera pública del vendedor (identificaba al frigorífico).
drop function if exists public.perfil_vendedor(uuid);
drop function if exists public.lotes_de_vendedor(uuid);
