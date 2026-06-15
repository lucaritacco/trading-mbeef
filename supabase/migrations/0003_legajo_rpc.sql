-- ============================================================================
-- DeCarnes · 0003 · Etapa B vía función controlada (más robusta y verificable)
-- ----------------------------------------------------------------------------
-- CÓMO APLICARLO:  Supabase → SQL Editor → New query → pegar TODO → Run.
-- Reemplaza la política de UPDATE directa de 0002 por una función que:
--   · solo completa un legajo que esté 'pendiente', identificándolo por su id;
--   · devuelve true/false (así el navegador SÍ sabe si guardó);
--   · corre con permisos del dueño (SECURITY DEFINER), por lo que anon NO
--     necesita —ni tiene— permiso de UPDATE directo sobre la tabla.
-- No abre ninguna lectura: anon sigue sin poder SELECT la tabla.
-- ============================================================================

-- Ya no hace falta el UPDATE directo de anon: lo reemplaza la función.
drop policy if exists "lotes anon completar legajo" on public.lotes;

create or replace function public.completar_legajo(p_id uuid, p_datos jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  filas int;
begin
  update public.lotes set
    razon_social                   = p_datos->>'razon_social',
    nombre_fantasia                = p_datos->>'nombre_fantasia',
    ruca_numero                    = p_datos->>'ruca_numero',
    ruca_categoria                 = p_datos->>'ruca_categoria',
    habilitacion_tipo              = p_datos->>'habilitacion_tipo',
    habilitacion_numero            = p_datos->>'habilitacion_numero',
    empresa_provincia              = p_datos->>'empresa_provincia',
    empresa_localidad              = p_datos->>'empresa_localidad',
    referencias_comerciales        = p_datos->>'referencias_comerciales',
    declaracion_jurada             = coalesce((p_datos->>'declaracion_jurada')::boolean, false),
    archivo_afip_path              = p_datos->>'archivo_afip_path',
    archivo_habilitacion_path      = p_datos->>'archivo_habilitacion_path',
    archivos_certificaciones_paths = case
      when jsonb_typeof(p_datos->'archivos_certificaciones_paths') = 'array'
      then array(select jsonb_array_elements_text(p_datos->'archivos_certificaciones_paths'))
      else null end,
    legajo_estado = 'completo'
  where id = p_id and legajo_estado = 'pendiente';

  get diagnostics filas = row_count;
  return filas > 0;
end;
$$;

-- Solo anon (el navegador) puede ejecutar la función; nadie más por defecto.
revoke all on function public.completar_legajo(uuid, jsonb) from public;
grant execute on function public.completar_legajo(uuid, jsonb) to anon;
