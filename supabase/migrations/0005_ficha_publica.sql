-- ============================================================================
-- DeCarnes · 0005 · Ficha pública de lote (item C)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
--
-- Seguridad: NO se abre la tabla `lotes` a lectura pública. El acceso público
-- pasa SOLO por la función get_ficha_publica(), que:
--   · devuelve únicamente columnas comerciales seguras (nada de proveedor,
--     CUIT, contacto, precios, márgenes, legajo ni análisis interno);
--   · solo si el lote está marcado publico = true.
-- ============================================================================

-- 1) Flag de visibilidad pública (lo enciende el panel). Default: NO público.
alter table public.lotes
  add column if not exists publico boolean not null default false;

-- 2) Ficha pública: solo columnas comerciales seguras, solo lotes públicos.
create or replace function public.get_ficha_publica(p_id uuid)
returns table (
  id                    uuid,
  created_at            timestamptz,
  tipo_producto         text,
  especie_categoria     text,
  cortes                text[],
  cortes_otro           text,
  kilos_totales         numeric,
  piezas_cajas          integer,
  lote_estado           text,
  envasado_tipo         text,
  envasado_marca        text,
  fecha_faena           date,
  fecha_vencimiento     date,
  ubicacion_provincia   text,
  ubicacion_localidad   text,
  observaciones_calidad text,
  fotos_paths           text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select id, created_at, tipo_producto, especie_categoria, cortes, cortes_otro,
         kilos_totales, piezas_cajas, lote_estado, envasado_tipo, envasado_marca,
         fecha_faena, fecha_vencimiento, ubicacion_provincia, ubicacion_localidad,
         observaciones_calidad, fotos_paths
  from public.lotes
  where id = p_id and publico = true;
$$;

revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- 3) Helper para la policy de Storage: ¿este id de lote es público?
--    SECURITY DEFINER para poder mirar lotes.publico sin abrir RLS de la tabla.
create or replace function public.es_lote_publico(p_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.lotes where id::text = p_id and publico = true
  );
$$;
grant execute on function public.es_lote_publico(text) to anon, authenticated;

-- 4) Storage: anon puede LEER (firmar) SOLO las fotos de lotes públicos.
--    El primer segmento del path es el id del lote (carpeta = id).
drop policy if exists "publico lee fotos de lotes publicos" on storage.objects;
create policy "publico lee fotos de lotes publicos" on storage.objects
  for select to anon
  using (
    bucket_id = 'lotes-fotos'
    and public.es_lote_publico((storage.foldername(name))[1])
  );
