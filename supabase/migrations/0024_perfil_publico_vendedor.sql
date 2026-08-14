-- ============================================================================
-- DeCarnes · 0024 · Perfil público del frigorífico (foto + descripción)
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
-- CAMBIO DE RUMBO respecto de la 0017: el proveedor deja de ser anónimo. Cuando
-- MBEEF era el broker tenía sentido ocultarlo; ahora cada frigorífico publica a
-- su nombre y se verifica, así que el lote muestra de quién es. Lo que se expone
-- es SOLO identidad comercial (nombre de fantasía, foto, descripción, provincia):
-- nunca cuit, whatsapp, email ni localidad exacta.
-- ============================================================================

-- 1) Perfil público del frigorífico.
alter table public.usuarios
  add column if not exists foto_path text,
  add column if not exists descripcion text;

-- 2) Bucket público para las fotos de perfil. Son logos/frentes pensados para
--    verse: público evita firmar URLs en cada tarjeta del catálogo.
insert into storage.buckets (id, name, public)
values ('perfiles', 'perfiles', true)
on conflict (id) do update set public = true;

-- Cada usuario administra SOLO su carpeta (el primer segmento es su uid).
drop policy if exists "perfiles lectura publica" on storage.objects;
create policy "perfiles lectura publica" on storage.objects
  for select using (bucket_id = 'perfiles');

drop policy if exists "perfiles subida propia" on storage.objects;
create policy "perfiles subida propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "perfiles update propio" on storage.objects;
create policy "perfiles update propio" on storage.objects
  for update to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "perfiles delete propio" on storage.objects;
create policy "perfiles delete propio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) El catálogo vuelve a identificar al vendedor (nombre + foto + sello).
drop function if exists public.catalogo_publico(text, text, text, text);
create function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text,
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
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
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text,
  observaciones_calidad text, fotos_paths text[],
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
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

-- 4) Vidriera del frigorífico: su perfil y sus lotes. Sin datos de contacto.
create or replace function public.perfil_vendedor(p_id uuid)
returns table (
  id uuid, nombre text, foto_path text, descripcion text,
  provincia text, verificado boolean, cant_lotes bigint)
language sql security definer set search_path = public stable as $$
  select u.id, coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         u.foto_path, u.descripcion, u.provincia, coalesce(u.verificado, false),
         (select count(*) from public.lotes l
           where l.user_id = u.id and l.publico = true and l.vendido = false
             and (l.publicado_hasta is null or l.publicado_hasta >= current_date))
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
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text,
  verificado boolean, vendedor_id uuid, vendedor_nombre text, vendedor_foto text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
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

-- 5) ¿Tiene el perfil completo? Decide si /cuenta muestra el onboarding.
create or replace function public.mi_estado_cuenta()
returns table (
  verificado boolean, rol_mercado text, empresa text,
  foto_path text, descripcion text, provincia text, whatsapp text,
  perfil_completo boolean)
language sql security definer set search_path = public stable as $$
  select u.verificado, u.rol_mercado,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         u.foto_path, u.descripcion, u.provincia, u.whatsapp,
         (coalesce(u.nombre_fantasia, u.razon_social, u.empresa) is not null
          and u.provincia is not null
          and u.whatsapp is not null
          and u.descripcion is not null)
  from public.usuarios u where u.id = auth.uid() limit 1;
$$;
revoke all on function public.mi_estado_cuenta() from public;
revoke execute on function public.mi_estado_cuenta() from anon;
grant execute on function public.mi_estado_cuenta() to authenticated;
