-- ============================================================================
-- DeCarnes · 0016 · Búsquedas (RFQ) — el mercado invertido
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Compradores publican lo que buscan; vendedores responden con ofertas.
-- AISLAMIENTO CRÍTICO de ofertas: un vendedor solo ve las SUYAS; el comprador
-- dueño de la búsqueda ve TODAS las de su búsqueda. Ningún vendedor ve las de la
-- competencia. Se logra con RLS "own-only" en la tabla + funciones SECURITY
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
