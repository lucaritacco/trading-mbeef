-- ============================================================================
-- DeCarnes · Esquema inicial para el formulario "Publicá tu lote"
-- ----------------------------------------------------------------------------
-- CÓMO APLICARLO:
--   Panel de Supabase → menú izquierdo "SQL Editor" → botón "New query"
--   → pegá TODO este archivo → botón "Run".
-- Es idempotente: lo podés correr más de una vez sin romper nada.
-- ============================================================================

-- 1) Tabla descartable para probar la conexión (guardar + leer con la anon key)
create table if not exists public.connection_test (
  id         uuid primary key default gen_random_uuid(),
  mensaje    text not null,
  created_at timestamptz not null default now()
);

-- 2) Tabla principal: una fila por lote publicado.
--    Junta empresa + lote + condiciones (el wizard arma todo del lado del
--    navegador y al final hace UN solo insert).
create table if not exists public.lotes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  -- pipeline interno: nuevo → en_analisis → ofertado → aceptado → colocado → cobrado / rechazado
  estado      text not null default 'nuevo',

  -- Paso 1 · Empresa / proveedor
  razon_social                  text,
  nombre_fantasia               text,
  cuit                          text,
  ruca_numero                   text,
  ruca_categoria                text,  -- frigorifico | matarife_abastecedor | despostadero | distribuidor
  habilitacion_tipo             text,  -- senasa_federal | senasa_provincial | senasa_municipal
  habilitacion_numero           text,
  empresa_provincia             text,
  empresa_localidad             text,
  contacto_nombre               text,
  contacto_cargo                text,
  contacto_telefono             text,
  contacto_email                text,
  referencias_comerciales       text,
  declaracion_jurada            boolean not null default false,
  -- rutas de archivos en Storage (bucket "documentos")
  archivo_afip_path             text,
  archivo_habilitacion_path     text,
  archivos_certificaciones_paths text[],

  -- Paso 2 · Lote
  tipo_producto         text,    -- media_res | cuarto | cortes_despostados | menudencias | otro
  especie_categoria     text,
  cortes                text[],
  cortes_otro           text,
  kilos_totales         numeric,
  piezas_cajas          integer,
  lote_estado           text,    -- enfriado | congelado
  fecha_faena           date,
  fecha_vencimiento     date,
  envasado_tipo         text,    -- vacio | caja | granel | otro
  envasado_marca        text,
  ubicacion_provincia   text,
  ubicacion_localidad   text,
  observaciones_calidad text,
  -- rutas de fotos/video en Storage (bucket "lotes-fotos")
  fotos_paths           text[],
  video_path            text,

  -- Paso 3 · Condiciones pretendidas
  precio_pretendido_kg  numeric, -- ARS, orientativo
  condicion_pago        text,    -- contado | 7 | 15 | 30 | a_convenir
  disponibilidad_desde  date,
  necesita_flete        text,    -- si | no | a_convenir
  preferencia_operacion text     -- directo | comision | lo_que_convenga
);

-- 3) Row Level Security (RLS)
alter table public.connection_test enable row level security;
alter table public.lotes           enable row level security;

-- connection_test: anon puede insertar y leer (tabla no sensible, solo smoke test)
drop policy if exists "connection_test anon insert" on public.connection_test;
create policy "connection_test anon insert" on public.connection_test
  for insert to anon with check (true);

drop policy if exists "connection_test anon select" on public.connection_test;
create policy "connection_test anon select" on public.connection_test
  for select to anon using (true);

-- lotes: el formulario público (anon) SOLO puede insertar.
-- La lectura queda para el panel interno, que del lado del servidor usa la
-- service_role key (que saltea RLS). Así, anon nunca lee datos de otros
-- proveedores ni la lista de lotes.
drop policy if exists "lotes anon insert" on public.lotes;
create policy "lotes anon insert" on public.lotes
  for insert to anon with check (true);

-- 4) Storage: buckets PRIVADOS para documentos y fotos de lotes
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('lotes-fotos', 'lotes-fotos', false)
on conflict (id) do nothing;

-- El formulario (anon) puede SUBIR archivos a esos buckets.
-- La descarga NO se habilita para anon: el panel interno generará URLs
-- firmadas con la service_role cuando haga falta.
drop policy if exists "anon sube a documentos" on storage.objects;
create policy "anon sube a documentos" on storage.objects
  for insert to anon
  with check (bucket_id = 'documentos');

drop policy if exists "anon sube a lotes-fotos" on storage.objects;
create policy "anon sube a lotes-fotos" on storage.objects
  for insert to anon
  with check (bucket_id = 'lotes-fotos');
