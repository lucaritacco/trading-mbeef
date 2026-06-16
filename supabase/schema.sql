-- ============================================================================
-- DeCarnes · ESQUEMA COMPLETO (estado final) · "Publicá tu lote"
-- ----------------------------------------------------------------------------
-- Este archivo reemplaza a 0001 + 0002 + 0003 de una sola vez.
-- CÓMO APLICARLO:  Supabase → SQL Editor → New query → pegar TODO → Run.
--
-- ⚠ OJO: borra y recrea las tablas connection_test y lotes, así que ELIMINA las
--    filas de prueba que había. Es lo que querés para arrancar limpio.
--    NO toca otros datos de tu proyecto. Es seguro correrlo más de una vez.
-- ============================================================================

-- 0) Limpieza de lo anterior (idempotente)
drop function if exists public.completar_legajo(uuid, jsonb);
drop table if exists public.connection_test cascade;
drop table if exists public.lotes cascade;

-- ============================================================================
-- 1) Tablas
-- ============================================================================

-- Tabla descartable para probar la conexión (guardar + leer con la anon key)
create table public.connection_test (
  id         uuid primary key default gen_random_uuid(),
  mensaje    text not null,
  created_at timestamptz not null default now()
);

-- Tabla principal: una fila por lote publicado (empresa + lote + condiciones).
create table public.lotes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  estado      text not null default 'nuevo',          -- pipeline interno
  legajo_estado text not null default 'pendiente',    -- 'pendiente' | 'completo'

  -- Etapa A · Contacto mínimo
  contacto_nombre   text,
  contacto_telefono text,
  contacto_email    text,
  cuit              text,
  acepta_contacto   boolean not null default false,

  -- Etapa A · El lote
  tipo_producto         text,
  especie_categoria     text,
  cortes                text[],
  cortes_otro           text,
  kilos_totales         numeric,
  piezas_cajas          integer,
  lote_estado           text,            -- enfriado | congelado
  fecha_faena           date,
  fecha_vencimiento     date,
  envasado_tipo         text,
  envasado_marca        text,
  ubicacion_provincia   text,
  ubicacion_localidad   text,
  observaciones_calidad text,
  fotos_paths           text[],          -- bucket lotes-fotos
  video_path            text,

  -- Etapa A · Condiciones pretendidas
  precio_pretendido_kg  numeric,         -- ARS, orientativo
  condicion_pago        text,
  disponibilidad_desde  date,
  necesita_flete        text,            -- si | no | a_convenir
  preferencia_operacion text,            -- directo | comision | lo_que_convenga

  -- Etapa B · Empresa / legajo de aptitud (se completa después)
  razon_social                   text,
  nombre_fantasia                text,
  ruca_numero                    text,
  ruca_categoria                 text,
  habilitacion_tipo              text,
  habilitacion_numero            text,
  empresa_provincia              text,
  empresa_localidad              text,
  referencias_comerciales        text,
  declaracion_jurada             boolean not null default false,
  archivo_afip_path              text,   -- bucket documentos
  archivo_habilitacion_path      text,   -- bucket documentos
  archivos_certificaciones_paths text[]  -- bucket documentos
);

-- ============================================================================
-- 2) Row Level Security
-- ============================================================================
alter table public.connection_test enable row level security;
alter table public.lotes           enable row level security;

-- connection_test: anon inserta y lee (tabla no sensible, solo smoke test)
create policy "connection_test anon insert" on public.connection_test
  for insert to anon with check (true);
create policy "connection_test anon select" on public.connection_test
  for select to anon using (true);

-- lotes: el formulario público (anon) SOLO puede insertar (Etapa A).
-- La lectura queda para el panel interno (service_role, lado servidor).
create policy "lotes anon insert" on public.lotes
  for insert to anon with check (true);

-- ============================================================================
-- 3) Etapa B vía función controlada (anon NO hace UPDATE directo)
-- ============================================================================
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

revoke all on function public.completar_legajo(uuid, jsonb) from public;
grant execute on function public.completar_legajo(uuid, jsonb) to anon;

-- ============================================================================
-- 4) Storage: buckets privados + subida para el formulario (anon)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('lotes-fotos', 'lotes-fotos', false)
on conflict (id) do nothing;

drop policy if exists "anon sube a documentos" on storage.objects;
create policy "anon sube a documentos" on storage.objects
  for insert to anon with check (bucket_id = 'documentos');

drop policy if exists "anon sube a lotes-fotos" on storage.objects;
create policy "anon sube a lotes-fotos" on storage.objects
  for insert to anon with check (bucket_id = 'lotes-fotos');

-- ============================================================================
-- 5) Panel interno (equipo MBEEF)
-- ============================================================================
alter table public.lotes
  add column if not exists margen_bruto_pct numeric,
  add column if not exists oferta_monto      numeric,
  add column if not exists oferta_plazo_dias integer,
  add column if not exists oferta_modo       text,
  add column if not exists resultado         text,
  add column if not exists notas_internas    text;

create table if not exists public.config (
  id              boolean primary key default true,
  umbral_pasar    numeric not null default 10,
  umbral_comision numeric not null default 14,
  tasa_anual      numeric not null default 35,
  constraint config_fila_unica check (id)
);
insert into public.config (id) values (true) on conflict (id) do nothing;

create table if not exists public.staff (email text primary key);
alter table public.staff enable row level security;

create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.staff where email = auth.email());
$$;
grant execute on function public.is_staff() to authenticated;

alter table public.config enable row level security;

drop policy if exists "lotes staff select" on public.lotes;
create policy "lotes staff select" on public.lotes
  for select to authenticated using (public.is_staff());
drop policy if exists "lotes staff update" on public.lotes;
create policy "lotes staff update" on public.lotes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "config staff select" on public.config;
create policy "config staff select" on public.config
  for select to authenticated using (public.is_staff());
drop policy if exists "config staff update" on public.config;
create policy "config staff update" on public.config
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff lee documentos" on storage.objects;
create policy "staff lee documentos" on storage.objects
  for select to authenticated using (bucket_id = 'documentos' and public.is_staff());
drop policy if exists "staff lee lotes-fotos" on storage.objects;
create policy "staff lee lotes-fotos" on storage.objects
  for select to authenticated using (bucket_id = 'lotes-fotos' and public.is_staff());

insert into public.staff (email) values ('lucarita2006@gmail.com') on conflict do nothing;

-- ============================================================================
-- 6) Ficha pública de lote (item C)
-- ============================================================================
alter table public.lotes
  add column if not exists publico boolean not null default false;

create or replace function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, tipo_producto text, especie_categoria text,
  cortes text[], cortes_otro text, kilos_totales numeric, piezas_cajas integer,
  lote_estado text, envasado_tipo text, envasado_marca text, fecha_faena date,
  fecha_vencimiento date, ubicacion_provincia text, ubicacion_localidad text,
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select id, created_at, tipo_producto, especie_categoria, cortes, cortes_otro,
         kilos_totales, piezas_cajas, lote_estado, envasado_tipo, envasado_marca,
         fecha_faena, fecha_vencimiento, ubicacion_provincia, ubicacion_localidad,
         observaciones_calidad, fotos_paths
  from public.lotes where id = p_id and publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

create or replace function public.es_lote_publico(p_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.lotes where id::text = p_id and publico = true);
$$;
grant execute on function public.es_lote_publico(text) to anon, authenticated;

drop policy if exists "publico lee fotos de lotes publicos" on storage.objects;
create policy "publico lee fotos de lotes publicos" on storage.objects
  for select to anon
  using (bucket_id = 'lotes-fotos' and public.es_lote_publico((storage.foldername(name))[1]));

-- ============================================================================
-- 7) Registro de demanda de compradores (item B2) · solo staff
-- ============================================================================
create table if not exists public.compradores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  contacto text, cortes_busca text, volumenes text, frecuencia text,
  precio_max numeric, plazo_habitual text, linea_credito numeric, notas text
);
alter table public.compradores enable row level security;

drop policy if exists "compradores staff select" on public.compradores;
create policy "compradores staff select" on public.compradores
  for select to authenticated using (public.is_staff());
drop policy if exists "compradores staff insert" on public.compradores;
create policy "compradores staff insert" on public.compradores
  for insert to authenticated with check (public.is_staff());
drop policy if exists "compradores staff update" on public.compradores;
create policy "compradores staff update" on public.compradores
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "compradores staff delete" on public.compradores;
create policy "compradores staff delete" on public.compradores
  for delete to authenticated using (public.is_staff());
