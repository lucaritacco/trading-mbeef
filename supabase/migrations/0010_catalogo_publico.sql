-- ============================================================================
-- DeCarnes · 0010 · Catálogo PÚBLICO (ver lotes sin iniciar sesión)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
--
-- Devuelve SOLO columnas comerciales de lotes publicados. A diferencia de
-- catalogo() (interno, logueado), NO expone la empresa vendedora ni su contacto:
-- la parte pública muestra el producto y la consulta se canaliza por MBEEF
-- (botón de la ficha /lote/[id]). Nunca user_id, nunca teléfono.
-- Habilitada para anon (visitantes sin login) y authenticated.
-- ============================================================================

create or replace function public.catalogo_publico(
  p_corte text default null,
  p_provincia text default null,
  p_estado text default null,
  p_q text default null
)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric, kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, ubicacion_localidad text, created_at timestamptz,
  foto_principal text
)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg, l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.ubicacion_localidad, l.created_at,
         (l.fotos_paths)[1]
  from public.lotes l
  where l.publico = true
    and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia)
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%' || p_q || '%' or l.descripcion ilike '%' || p_q || '%')
  order by l.created_at desc
  limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;
