-- ============================================================================
-- DeCarnes · 0008 · Mercado: perfil de empresa, carga de lote, catálogo, contacto
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
-- Requiere: usuarios (0007), lotes, is_staff(), es_lote_publico() (tandas previas).
--
-- Resumen de seguridad (detalle en TANDA4.md):
--   · Perfil: cada usuario edita SOLO su fila de `usuarios` (RLS ya existente).
--   · Lotes: el usuario inserta/lee/edita SOLO los suyos (user_id = auth.uid()).
--     NO se agrega un SELECT amplio sobre la tabla `lotes` para usuarios.
--   · Catálogo: se lee por la función `catalogo()` (SECURITY DEFINER) que expone
--     SOLO columnas comerciales + empresa/zona del dueño. Nunca user_id, nunca
--     teléfono, nunca columnas internas/legacy.
--   · Contacto: `contacto_lote()` devuelve el WhatsApp del dueño SOLO al hacer
--     clic (no va en el listado), evitando exponer números de forma masiva.
--   · No se tocan las RLS existentes (anon insert / staff). Se agregan solo las
--     políticas nuevas mínimas de abajo.
-- ============================================================================

-- 1) Perfil de empresa en `usuarios` (todo nullable; lo completa el usuario).
alter table public.usuarios
  add column if not exists razon_social        text,
  add column if not exists nombre_fantasia     text,
  add column if not exists ruca_numero         text,
  add column if not exists ruca_categoria      text,
  add column if not exists habilitacion_tipo   text,
  add column if not exists habilitacion_numero text,
  add column if not exists provincia           text,
  add column if not exists localidad           text,
  add column if not exists whatsapp            text,
  add column if not exists perfil_completo     boolean not null default false;

-- 2) Dueño y campos del lote del mercado (nullable; alinea con el form nuevo).
alter table public.lotes
  add column if not exists user_id          uuid references auth.users(id) on delete set null,
  add column if not exists titulo           text,
  add column if not exists corte            text,
  add column if not exists descripcion      text,
  add column if not exists modalidad_entrega text,
  add column if not exists moq              numeric,
  add column if not exists vigencia_dias    integer,
  add column if not exists publicado_hasta  date,
  add column if not exists certificados     text[];

create index if not exists lotes_user_id_idx on public.lotes (user_id);
create index if not exists lotes_catalogo_idx on public.lotes (publico, user_id);

-- 3) RLS de `lotes` para usuarios de beta (mínima; el dueño solo toca lo suyo).
drop policy if exists "lotes beta insert" on public.lotes;
create policy "lotes beta insert" on public.lotes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "lotes own select" on public.lotes;
create policy "lotes own select" on public.lotes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "lotes own update" on public.lotes;
create policy "lotes own update" on public.lotes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "lotes own delete" on public.lotes;
create policy "lotes own delete" on public.lotes
  for delete to authenticated using (user_id = auth.uid());

-- 4) Storage: subir y leer fotos del bucket lotes-fotos para usuarios logueados.
drop policy if exists "auth sube a lotes-fotos" on storage.objects;
create policy "auth sube a lotes-fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'lotes-fotos');

-- helper: ¿la carpeta (= id del lote) es un lote mío?
create or replace function public.es_mi_lote(p_folder text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.lotes where id::text = p_folder and user_id = auth.uid()
  );
$$;
grant execute on function public.es_mi_lote(text) to authenticated;

-- leer fotos de lotes públicos (catálogo) y de mis propios lotes (mis lotes).
drop policy if exists "auth lee fotos publicas" on storage.objects;
create policy "auth lee fotos publicas" on storage.objects
  for select to authenticated
  using (bucket_id = 'lotes-fotos' and public.es_lote_publico((storage.foldername(name))[1]));

drop policy if exists "auth lee sus fotos" on storage.objects;
create policy "auth lee sus fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'lotes-fotos' and public.es_mi_lote((storage.foldername(name))[1]));

-- 5) Catálogo: solo columnas comerciales seguras de lotes publicados de beta.
create or replace function public.catalogo(
  p_corte text default null,
  p_provincia text default null,
  p_estado text default null,
  p_q text default null
)
returns table (
  id uuid, titulo text, corte text, descripcion text, especie_categoria text,
  lote_estado text, fecha_faena date, precio_pretendido_kg numeric,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, ubicacion_localidad text,
  publicado_hasta date, created_at timestamptz,
  foto_principal text, empresa text, empresa_provincia text
)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.descripcion, l.especie_categoria,
         l.lote_estado, l.fecha_faena, l.precio_pretendido_kg,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.ubicacion_localidad,
         l.publicado_hasta, l.created_at,
         (l.fotos_paths)[1] as foto_principal,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa) as empresa,
         u.provincia as empresa_provincia
  from public.lotes l
  join public.usuarios u on u.id = l.user_id
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
revoke all on function public.catalogo(text, text, text, text) from public;
grant execute on function public.catalogo(text, text, text, text) to authenticated;

-- 6) Contacto: WhatsApp del dueño de un lote publicado (solo al hacer clic).
create or replace function public.contacto_lote(p_lote_id uuid)
returns table (whatsapp text, empresa text, titulo text, kilos numeric, provincia text)
language sql security definer set search_path = public stable as $$
  select u.whatsapp,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa) as empresa,
         l.titulo, l.kilos_totales, l.ubicacion_provincia
  from public.lotes l
  join public.usuarios u on u.id = l.user_id
  where l.id = p_lote_id and l.publico = true and l.user_id is not null
  limit 1;
$$;
revoke all on function public.contacto_lote(uuid) from public;
grant execute on function public.contacto_lote(uuid) to authenticated;
