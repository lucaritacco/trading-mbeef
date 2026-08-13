-- ============================================================================
-- DeCarnes · 0022 · Solicitudes moderadas + vitrina pública de demanda
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
-- Cambios:
--  1. Las búsquedas nacen 'pendiente': recién las ven los vendedores cuando el
--     staff las aprueba ('abierta'). Antes se publicaban solas.
--  2. El staff puede moderarlas desde el panel.
--  3. Vitrina pública de demanda para la home: solo aprobadas y ANÓNIMAS (sin
--     comprador, sin notas), para mostrarle al frigorífico que hay demanda real.
-- ============================================================================

-- 1) Estado con moderación. 'pendiente' | 'abierta' | 'rechazada' | 'cerrada'.
alter table public.busquedas alter column estado set default 'pendiente';

-- 2) El staff modera (leer ya podía por la policy own/staff select).
drop policy if exists "busquedas staff update" on public.busquedas;
create policy "busquedas staff update" on public.busquedas
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- 3) Vitrina pública: demanda anónima para la home.
--    No devuelve user_id, ni empresa, ni notas (podrían identificar al comprador).
create or replace function public.solicitudes_publicas(p_limite integer default 6)
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria,
         b.cantidad_kg, b.provincia, b.plazo_necesario
  from public.busquedas b
  where b.estado = 'abierta'
  order by b.created_at desc
  limit greatest(1, least(coalesce(p_limite, 6), 24));
$$;
revoke all on function public.solicitudes_publicas(integer) from public;
grant execute on function public.solicitudes_publicas(integer) to anon, authenticated;

-- 4) Cuántas hay abiertas (para el encabezado de la sección).
create or replace function public.solicitudes_abiertas_count()
returns bigint
language sql security definer set search_path = public stable as $$
  select count(*)::bigint from public.busquedas where estado = 'abierta';
$$;
revoke all on function public.solicitudes_abiertas_count() from public;
grant execute on function public.solicitudes_abiertas_count() to anon, authenticated;

-- 5) Datos para el aviso al staff (lo usa la ruta /api con service_role).
create or replace function public.solicitud_para_aviso(p_id uuid)
returns table (
  tipo_corte text, especie_categoria text, cantidad_kg numeric,
  provincia text, plazo_necesario text, precio_referencia numeric,
  notas text, comprador_empresa text, comprador_email text)
language sql security definer set search_path = public, auth stable as $$
  select b.tipo_corte, b.especie_categoria, b.cantidad_kg, b.provincia,
         b.plazo_necesario, b.precio_referencia, b.notas,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa), au.email
  from public.busquedas b
    join public.usuarios u on u.id = b.user_id
    left join auth.users au on au.id = b.user_id
  where b.id = p_id
  limit 1;
$$;
revoke all on function public.solicitud_para_aviso(uuid) from public, anon, authenticated;
grant execute on function public.solicitud_para_aviso(uuid) to service_role;
