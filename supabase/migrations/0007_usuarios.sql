-- ============================================================================
-- DeCarnes · 0007 · Usuarios de beta + invitaciones por token
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
-- Requiere is_staff() (migración del panel) y la tabla solicitudes_beta (0006).
--
-- Modelo de acceso:
--   · Cada solicitud_beta tiene un token de invitación (uuid, de un solo uso).
--   · El token SOLO sirve si la solicitud está 'aprobada' y sin usar.
--   · El usuario se registra (Supabase Auth) y "canjea" el token: recién ahí se
--     crea su fila en `usuarios`. Sin token aprobado → NO hay cuenta funcional.
--   · `usuarios` es 1:1 con auth.users. Cada uno ve/edita SOLO su fila; staff ve
--     todas. El alta entra únicamente por la función canjear_invitacion
--     (SECURITY DEFINER): no hay política de INSERT para usuarios.
--   · is_staff() sigue siendo por email en `staff`: un usuario de beta NO es staff.
-- ============================================================================

-- 1) Token de invitación por solicitud (vale solo cuando está 'aprobada').
alter table public.solicitudes_beta
  add column if not exists invitacion_token uuid not null default gen_random_uuid(),
  add column if not exists invitacion_usada boolean not null default false;

create unique index if not exists solicitudes_beta_token_idx
  on public.solicitudes_beta (invitacion_token);

-- 2) Perfil de usuario de beta (1:1 con auth.users).
create table if not exists public.usuarios (
  id           uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  solicitud_id uuid references public.solicitudes_beta(id),
  empresa      text,
  cuit         text,
  rol_mercado  text,    -- 'vende' | 'compra' | 'ambas'
  estado       text not null default 'activo'
);
alter table public.usuarios enable row level security;

-- Cada usuario ve SOLO su fila; el staff ve todas. Nadie lee la de otro.
drop policy if exists "usuarios own select" on public.usuarios;
create policy "usuarios own select" on public.usuarios
  for select to authenticated using (id = auth.uid());

drop policy if exists "usuarios own update" on public.usuarios;
create policy "usuarios own update" on public.usuarios
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "usuarios staff select" on public.usuarios;
create policy "usuarios staff select" on public.usuarios
  for select to authenticated using (public.is_staff());
-- (sin política de INSERT/DELETE: el alta entra solo por canjear_invitacion)

-- 3) Validar invitación (para mostrar el formulario de registro). Para anon.
create or replace function public.validar_invitacion(p_token uuid)
returns table (valido boolean, empresa text)
language sql security definer set search_path = public stable as $$
  select true, s.empresa
  from public.solicitudes_beta s
  where s.invitacion_token = p_token
    and s.estado = 'aprobada'
    and s.invitacion_usada = false
  limit 1;
$$;
revoke all on function public.validar_invitacion(uuid) from public;
grant execute on function public.validar_invitacion(uuid) to anon, authenticated;

-- 4) Canjear invitación: crea la fila `usuarios` para el usuario logueado.
--    Solo si el token está aprobado y sin usar. Marca el token como usado.
create or replace function public.canjear_invitacion(p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if auth.uid() is null then
    return false;
  end if;
  -- Idempotente: si ya tiene cuenta, ok.
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    return true;
  end if;
  select * into s
    from public.solicitudes_beta
    where invitacion_token = p_token
      and estado = 'aprobada'
      and invitacion_usada = false
    for update;
  if not found then
    return false;
  end if;
  insert into public.usuarios (id, solicitud_id, empresa, cuit, rol_mercado)
    values (auth.uid(), s.id, s.empresa, s.cuit, s.rol);
  update public.solicitudes_beta set invitacion_usada = true where id = s.id;
  return true;
end;
$$;
revoke all on function public.canjear_invitacion(uuid) from public;
grant execute on function public.canjear_invitacion(uuid) to authenticated;
