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

-- ============================================================================
-- 8) Alta de beta con aprobación manual (`solicitudes_beta`)
-- ============================================================================
create table if not exists public.solicitudes_beta (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre_contacto text, empresa text, cuit text,
  rol text,        -- 'vende' | 'compra' | 'ambas'
  contacto text, notas text,
  estado text not null default 'pendiente'  -- 'pendiente' | 'aprobada' | 'rechazada'
);
alter table public.solicitudes_beta enable row level security;

drop policy if exists "solicitudes anon insert" on public.solicitudes_beta;
create policy "solicitudes anon insert" on public.solicitudes_beta
  for insert to anon with check (true);
drop policy if exists "solicitudes staff select" on public.solicitudes_beta;
create policy "solicitudes staff select" on public.solicitudes_beta
  for select to authenticated using (public.is_staff());
drop policy if exists "solicitudes staff update" on public.solicitudes_beta;
create policy "solicitudes staff update" on public.solicitudes_beta
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- N° de habilitación del vendedor (solo vende/ambas; verificación manual del staff)
alter table public.solicitudes_beta
  add column if not exists habilitacion_nro text;

-- ============================================================================
-- 9) Usuarios de beta + invitaciones por token
-- ============================================================================
alter table public.solicitudes_beta
  add column if not exists invitacion_token uuid not null default gen_random_uuid(),
  add column if not exists invitacion_usada boolean not null default false;
create unique index if not exists solicitudes_beta_token_idx
  on public.solicitudes_beta (invitacion_token);

-- WhatsApp opcional del alta (el `contacto` guarda el email obligatorio; tanda 0014)
alter table public.solicitudes_beta
  add column if not exists whatsapp text;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  solicitud_id uuid references public.solicitudes_beta(id),
  empresa text, cuit text, rol_mercado text,
  estado text not null default 'activo'
);
-- Preferencia de avisos por email + token para el enlace de baja (tanda 0014)
alter table public.usuarios
  add column if not exists recibir_avisos boolean not null default true,
  add column if not exists avisos_token uuid not null default gen_random_uuid();
create unique index if not exists usuarios_avisos_token_idx
  on public.usuarios (avisos_token);
alter table public.usuarios enable row level security;

drop policy if exists "usuarios own select" on public.usuarios;
create policy "usuarios own select" on public.usuarios
  for select to authenticated using (id = auth.uid());
drop policy if exists "usuarios own update" on public.usuarios;
create policy "usuarios own update" on public.usuarios
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "usuarios staff select" on public.usuarios;
create policy "usuarios staff select" on public.usuarios
  for select to authenticated using (public.is_staff());

create or replace function public.validar_invitacion(p_token uuid)
returns table (valido boolean, empresa text)
language sql security definer set search_path = public stable as $$
  select true, s.empresa from public.solicitudes_beta s
  where s.invitacion_token = p_token and s.estado = 'aprobada' and s.invitacion_usada = false
  limit 1;
$$;
revoke all on function public.validar_invitacion(uuid) from public;
grant execute on function public.validar_invitacion(uuid) to anon, authenticated;

create or replace function public.canjear_invitacion(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then return true; end if;
  select * into s from public.solicitudes_beta
    where invitacion_token = p_token and estado = 'aprobada' and invitacion_usada = false
    for update;
  if not found then return false; end if;
  insert into public.usuarios (id, solicitud_id, empresa, cuit, rol_mercado)
    values (auth.uid(), s.id, s.empresa, s.cuit, s.rol);
  update public.solicitudes_beta set invitacion_usada = true where id = s.id;
  return true;
end; $$;
revoke all on function public.canjear_invitacion(uuid) from public;
grant execute on function public.canjear_invitacion(uuid) to authenticated;

-- ============================================================================
-- 10) Mercado: perfil de empresa, lote, catálogo, contacto (tanda 4)
-- ============================================================================
alter table public.usuarios
  add column if not exists razon_social text, add column if not exists nombre_fantasia text,
  add column if not exists ruca_numero text, add column if not exists ruca_categoria text,
  add column if not exists habilitacion_tipo text, add column if not exists habilitacion_numero text,
  add column if not exists provincia text, add column if not exists localidad text,
  add column if not exists whatsapp text, add column if not exists perfil_completo boolean not null default false;

alter table public.lotes
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists titulo text, add column if not exists corte text,
  add column if not exists descripcion text, add column if not exists modalidad_entrega text,
  add column if not exists moq numeric, add column if not exists vigencia_dias integer,
  add column if not exists publicado_hasta date, add column if not exists certificados text[];
create index if not exists lotes_user_id_idx on public.lotes (user_id);
create index if not exists lotes_catalogo_idx on public.lotes (publico, user_id);

drop policy if exists "lotes beta insert" on public.lotes;
create policy "lotes beta insert" on public.lotes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "lotes own select" on public.lotes;
create policy "lotes own select" on public.lotes for select to authenticated using (user_id = auth.uid());
drop policy if exists "lotes own update" on public.lotes;
create policy "lotes own update" on public.lotes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lotes own delete" on public.lotes;
create policy "lotes own delete" on public.lotes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "auth sube a lotes-fotos" on storage.objects;
create policy "auth sube a lotes-fotos" on storage.objects for insert to authenticated with check (bucket_id = 'lotes-fotos');

create or replace function public.es_mi_lote(p_folder text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.lotes where id::text = p_folder and user_id = auth.uid());
$$;
grant execute on function public.es_mi_lote(text) to authenticated;

drop policy if exists "auth lee fotos publicas" on storage.objects;
create policy "auth lee fotos publicas" on storage.objects for select to authenticated
  using (bucket_id = 'lotes-fotos' and public.es_lote_publico((storage.foldername(name))[1]));
drop policy if exists "auth lee sus fotos" on storage.objects;
create policy "auth lee sus fotos" on storage.objects for select to authenticated
  using (bucket_id = 'lotes-fotos' and public.es_mi_lote((storage.foldername(name))[1]));

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
    and (p_provincia is null or l.ubicacion_provincia = p_provincia)
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo(text, text, text, text) from public;
revoke execute on function public.catalogo(text, text, text, text) from anon;
grant execute on function public.catalogo(text, text, text, text) to authenticated;

create or replace function public.contacto_lote(p_lote_id uuid)
returns table (whatsapp text, empresa text, titulo text, kilos numeric, provincia text)
language sql security definer set search_path = public stable as $$
  select u.whatsapp, coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         l.titulo, l.kilos_totales, l.ubicacion_provincia
  from public.lotes l join public.usuarios u on u.id = l.user_id
  where l.id = p_lote_id and l.publico = true and l.user_id is not null limit 1;
$$;
revoke all on function public.contacto_lote(uuid) from public;
revoke execute on function public.contacto_lote(uuid) from anon;
grant execute on function public.contacto_lote(uuid) to authenticated;

-- Catálogo PÚBLICO (sin login): solo columnas comerciales, sin empresa ni contacto.
create or replace function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
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
  where l.publico = true and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia)
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;

-- Ficha pública con título/corte/descripción + precio + identidad pública del
-- vendedor para el badge (recrear al final; tandas 4, 6 y 15).
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
  vendedor_id uuid, vendedor_nombre text)
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
  from public.lotes l where l.id = p_id and l.publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- Perfil público del vendedor + sus lotes (tanda 15). Datos comerciales, sin
-- cuit/whatsapp/habilitación. Para la vidriera /vendedor/[id].
create or replace function public.perfil_vendedor(p_id uuid)
returns table (id uuid, nombre text, provincia text, localidad text, rol_mercado text, cant_lotes bigint)
language sql security definer set search_path = public stable as $$
  select u.id, coalesce(u.nombre_fantasia, u.razon_social, u.empresa) as nombre,
         u.provincia, u.localidad, u.rol_mercado,
         (select count(*) from public.lotes l
           where l.user_id = u.id and l.publico = true
             and (l.publicado_hasta is null or l.publicado_hasta >= current_date)) as cant_lotes
  from public.usuarios u
  where u.id = p_id and u.estado = 'activo'
    and coalesce(u.nombre_fantasia, u.razon_social, u.empresa) is not null
  limit 1;
$$;
revoke all on function public.perfil_vendedor(uuid) from public;
grant execute on function public.perfil_vendedor(uuid) to anon, authenticated;

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

-- Emails para notificaciones (solo service_role; leen auth.users). No accesibles
-- por anon ni authenticated: los usa el servidor para mandar avisos por email.
-- Filtra por recibir_avisos y devuelve el token de baja de cada usuario (tanda 0014).
drop function if exists public.emails_usuarios_activos(uuid);
create function public.emails_usuarios_activos(p_excluir uuid default null)
returns table (email text, token uuid)
language sql security definer set search_path = public, auth stable as $$
  select u.email, usr.avisos_token
  from public.usuarios usr
  join auth.users u on u.id = usr.id
  where usr.estado = 'activo'
    and usr.recibir_avisos = true
    and u.email is not null
    and (p_excluir is null or usr.id <> p_excluir);
$$;
revoke all on function public.emails_usuarios_activos(uuid) from public, anon, authenticated;
grant execute on function public.emails_usuarios_activos(uuid) to service_role;

create or replace function public.email_dueno_lote(p_lote_id uuid)
returns text
language sql security definer set search_path = public, auth stable as $$
  select u.email
  from public.lotes l
  join auth.users u on u.id = l.user_id
  where l.id = p_lote_id
  limit 1;
$$;
revoke all on function public.email_dueno_lote(uuid) from public, anon, authenticated;
grant execute on function public.email_dueno_lote(uuid) to service_role;


-- ============================================================================
-- 16) Búsquedas (RFQ) — el mercado invertido (tanda 0016)
-- ============================================================================
-- DEFINER que implementan el acceso cruzado controlado (chequeando auth.uid()).
-- Todo requiere login: las funciones se otorgan solo a `authenticated` (no anon).
-- ============================================================================

-- 1) Búsquedas (lo que publica el comprador) --------------------------------
create table if not exists public.busquedas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo_corte text,
  especie_categoria text,
  cantidad_kg numeric,
  provincia text,
  plazo_necesario text,
  precio_referencia numeric,
  notas text,
  estado text not null default 'abierta'  -- 'abierta' | 'cerrada'
);
alter table public.busquedas enable row level security;

-- Solo el dueño (y staff) accede a su fila directo. Las abiertas de otros se ven
-- vía funciones SECURITY DEFINER (curadas, sin user_id crudo ni contacto).
drop policy if exists "busquedas own select" on public.busquedas;
create policy "busquedas own select" on public.busquedas
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "busquedas own insert" on public.busquedas;
create policy "busquedas own insert" on public.busquedas
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "busquedas own update" on public.busquedas;
create policy "busquedas own update" on public.busquedas
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "busquedas own delete" on public.busquedas;
create policy "busquedas own delete" on public.busquedas
  for delete to authenticated using (user_id = auth.uid());

-- 2) Ofertas (lo que responde el vendedor) ----------------------------------
create table if not exists public.ofertas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  busqueda_id uuid not null references public.busquedas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  precio_por_kg numeric,
  cantidad_ofrecida_kg numeric,
  plazo_entrega text,
  notas text,
  estado text not null default 'enviada'  -- 'enviada' | 'aceptada' | 'rechazada'
);
alter table public.ofertas enable row level security;

-- RLS "own-only": por acceso DIRECTO cada quien ve SOLO sus ofertas (así un
-- vendedor jamás ve las de otro). El comprador ve las de su búsqueda por función.
drop policy if exists "ofertas own select" on public.ofertas;
create policy "ofertas own select" on public.ofertas
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "ofertas own insert" on public.ofertas;
create policy "ofertas own insert" on public.ofertas
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "ofertas own update" on public.ofertas;
create policy "ofertas own update" on public.ofertas
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists ofertas_busqueda_idx on public.ofertas (busqueda_id);
create index if not exists busquedas_user_idx on public.busquedas (user_id);

-- 3) Funciones (API segura) -------------------------------------------------

-- Lista de búsquedas ABIERTAS de todos. Solo empresa+zona del comprador (sin
-- user_id crudo ni contacto). ofertas_count solo para el dueño (no filtrar
-- competencia). Requiere login.
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
    and (p_provincia is null or b.provincia = p_provincia)
  order by b.created_at desc limit 200;
$$;
revoke all on function public.busquedas_abiertas(text, text) from public;
revoke execute on function public.busquedas_abiertas(text, text) from anon;
grant execute on function public.busquedas_abiertas(text, text) to authenticated;

-- Detalle de una búsqueda (abierta de cualquiera, o propia en cualquier estado).
create or replace function public.busqueda_ver(p_id uuid)
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text, precio_referencia numeric,
  notas text, estado text, comprador_empresa text, es_mia boolean)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria,
         b.cantidad_kg, b.provincia, b.plazo_necesario, b.precio_referencia,
         b.notas, b.estado, coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         (b.user_id = auth.uid())
  from public.busquedas b join public.usuarios u on u.id = b.user_id
  where b.id = p_id and auth.uid() is not null
    and (b.estado = 'abierta' or b.user_id = auth.uid())
  limit 1;
$$;
revoke all on function public.busqueda_ver(uuid) from public;
revoke execute on function public.busqueda_ver(uuid) from anon;
grant execute on function public.busqueda_ver(uuid) to authenticated;

-- Crear oferta (vendedor). Valida búsqueda abierta y que no sea la propia.
create or replace function public.crear_oferta(
  p_busqueda_id uuid, p_precio numeric, p_cantidad numeric, p_plazo text, p_notas text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_dueno uuid; v_estado text;
begin
  if auth.uid() is null then raise exception 'sin sesion'; end if;
  select user_id, estado into v_dueno, v_estado from public.busquedas where id = p_busqueda_id;
  if v_dueno is null then raise exception 'busqueda inexistente'; end if;
  if v_estado <> 'abierta' then raise exception 'la busqueda esta cerrada'; end if;
  if v_dueno = auth.uid() then raise exception 'no podes ofertar tu propia busqueda'; end if;
  insert into public.ofertas (busqueda_id, user_id, precio_por_kg, cantidad_ofrecida_kg, plazo_entrega, notas)
    values (p_busqueda_id, auth.uid(), p_precio, p_cantidad, p_plazo, p_notas)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.crear_oferta(uuid, numeric, numeric, text, text) from public;
revoke execute on function public.crear_oferta(uuid, numeric, numeric, text, text) from anon;
grant execute on function public.crear_oferta(uuid, numeric, numeric, text, text) to authenticated;

-- Ofertas de una búsqueda. Dueño de la búsqueda → TODAS; vendedor → solo las suyas.
create or replace function public.ofertas_de_busqueda(p_busqueda_id uuid)
returns table (
  id uuid, created_at timestamptz, precio_por_kg numeric, cantidad_ofrecida_kg numeric,
  plazo_entrega text, notas text, estado text, vendedor_empresa text, es_mia boolean)
language sql security definer set search_path = public stable as $$
  select o.id, o.created_at, o.precio_por_kg, o.cantidad_ofrecida_kg,
         o.plazo_entrega, o.notas, o.estado,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         (o.user_id = auth.uid())
  from public.ofertas o join public.usuarios u on u.id = o.user_id
  where o.busqueda_id = p_busqueda_id and auth.uid() is not null
    and (
      exists (select 1 from public.busquedas b
              where b.id = p_busqueda_id and b.user_id = auth.uid())
      or o.user_id = auth.uid()
    )
  order by o.precio_por_kg asc nulls last, o.created_at asc;
$$;
revoke all on function public.ofertas_de_busqueda(uuid) from public;
revoke execute on function public.ofertas_de_busqueda(uuid) from anon;
grant execute on function public.ofertas_de_busqueda(uuid) to authenticated;

-- Aceptar/rechazar una oferta. Solo el comprador dueño de la búsqueda.
create or replace function public.responder_oferta(p_oferta_id uuid, p_estado text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  if p_estado not in ('aceptada', 'rechazada', 'enviada') then return false; end if;
  select exists (
    select 1 from public.ofertas o join public.busquedas b on b.id = o.busqueda_id
    where o.id = p_oferta_id and b.user_id = auth.uid()
  ) into v_ok;
  if not v_ok then return false; end if;
  update public.ofertas set estado = p_estado where id = p_oferta_id;
  return true;
end;
$$;
revoke all on function public.responder_oferta(uuid, text) from public;
revoke execute on function public.responder_oferta(uuid, text) from anon;
grant execute on function public.responder_oferta(uuid, text) to authenticated;

-- Contacto del vendedor de una oferta. Solo el comprador dueño y solo si ACEPTADA.
create or replace function public.contacto_oferta(p_oferta_id uuid)
returns table (whatsapp text, empresa text)
language sql security definer set search_path = public stable as $$
  select u.whatsapp, coalesce(u.nombre_fantasia, u.razon_social, u.empresa)
  from public.ofertas o
    join public.busquedas b on b.id = o.busqueda_id
    join public.usuarios u on u.id = o.user_id
  where o.id = p_oferta_id and b.user_id = auth.uid() and o.estado = 'aceptada'
  limit 1;
$$;
revoke all on function public.contacto_oferta(uuid) from public;
revoke execute on function public.contacto_oferta(uuid) from anon;
grant execute on function public.contacto_oferta(uuid) to authenticated;

-- Mis búsquedas (dueño). Incluye conteo de ofertas recibidas.
create or replace function public.mis_busquedas()
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text, estado text, ofertas_count bigint)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria, b.cantidad_kg,
         b.provincia, b.plazo_necesario, b.estado,
         (select count(*) from public.ofertas o where o.busqueda_id = b.id)
  from public.busquedas b where b.user_id = auth.uid()
  order by b.created_at desc;
$$;
revoke all on function public.mis_busquedas() from public;
revoke execute on function public.mis_busquedas() from anon;
grant execute on function public.mis_busquedas() to authenticated;

-- Mis ofertas (vendedor). Con un resumen de la búsqueda asociada.
create or replace function public.mis_ofertas()
returns table (
  id uuid, created_at timestamptz, busqueda_id uuid, precio_por_kg numeric,
  cantidad_ofrecida_kg numeric, plazo_entrega text, estado text,
  busqueda_corte text, busqueda_cantidad numeric, busqueda_estado text)
language sql security definer set search_path = public stable as $$
  select o.id, o.created_at, o.busqueda_id, o.precio_por_kg, o.cantidad_ofrecida_kg,
         o.plazo_entrega, o.estado, b.tipo_corte, b.cantidad_kg, b.estado
  from public.ofertas o join public.busquedas b on b.id = o.busqueda_id
  where o.user_id = auth.uid()
  order by o.created_at desc;
$$;
revoke all on function public.mis_ofertas() from public;
revoke execute on function public.mis_ofertas() from anon;
grant execute on function public.mis_ofertas() to authenticated;


-- ============================================================================
-- 17) Catalogo/ficha publicos ANONIMOS (tanda 0017): sin datos del dueno ni
--     localidad; se quitan perfil_vendedor/lotes_de_vendedor. Solo producto+prov.
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
