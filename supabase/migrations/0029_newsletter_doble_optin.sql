-- ============================================================================
-- DeCarnes · 0029 · Doble opt-in del newsletter
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
-- El alta al newsletter es pública y sin validación: cualquiera puede dejar una
-- dirección ajena o inventada, y esa dirección entra en la misma difusión de
-- "lote nuevo" que los usuarios. Una dirección falsa rebota en cada envío, y
-- los rebotes son lo que arruina la reputación del dominio.
--
-- Desde acá, un suscriptor recibe mails recién cuando toca el link de
-- confirmación. El bot que deja una dirección falsa nunca confirma.
-- ============================================================================

alter table public.suscriptores
  add column if not exists confirmado boolean not null default false,
  add column if not exists confirmacion_token uuid not null default gen_random_uuid();

create index if not exists suscriptores_confirmacion_idx
  on public.suscriptores (confirmacion_token);

-- Los que ya estaban se anotaron cuando la regla no existía: arrancan
-- confirmados. Si no, desaparecerían de la lista sin enterarse.
-- La fecha fija hace que volver a correr la migración no confirme pendientes.
update public.suscriptores
  set confirmado = true
  where created_at < timestamptz '2026-08-21 00:00:00+00';

-- Dirección de prueba con TLD reservado (.test no existe): rebota siempre.
delete from public.suscriptores where email like '%@decarnes.test';

-- Alta pública. Ahora devuelve el token de confirmación para poder mandarle el
-- mail. Devuelve NULL si ya estaba confirmado: en ese caso no hay nada que
-- mandar y se le avisa que ya estaba en la lista.
drop function if exists public.suscribir(text, text);
create function public.suscribir(p_nombre text, p_email text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_token uuid;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email invalido';
  end if;
  insert into public.suscriptores (nombre, email)
    values (nullif(btrim(p_nombre), ''), lower(btrim(p_email)))
  on conflict (email) do update
    set baja = false,
        nombre = coalesce(excluded.nombre, public.suscriptores.nombre)
  returning (case when confirmado then null else confirmacion_token end)
    into v_token;
  return v_token;
end;
$$;
revoke all on function public.suscribir(text, text) from public;
grant execute on function public.suscribir(text, text) to anon, authenticated;

-- Confirmación desde el link del mail. Pública a propósito: el token ES la
-- credencial, y solo lo tiene quien recibió el mail en esa casilla.
create or replace function public.confirmar_suscripcion(p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  update public.suscriptores
    set confirmado = true, baja = false
    where confirmacion_token = p_token
    returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;
revoke all on function public.confirmar_suscripcion(uuid) from public;
grant execute on function public.confirmar_suscripcion(uuid) to anon, authenticated;

-- El broadcast ahora exige confirmación.
create or replace function public.emails_suscriptores()
returns table (email text, token uuid)
language sql security definer set search_path = public, auth stable as $$
  select s.email, s.baja_token
  from public.suscriptores s
  where s.baja = false and s.confirmado = true and s.email is not null
    and not exists (
      select 1 from public.usuarios u join auth.users au on au.id = u.id
      where lower(au.email) = s.email and u.estado = 'activo' and u.recibir_avisos = true
    );
$$;
revoke all on function public.emails_suscriptores() from public, anon, authenticated;
grant execute on function public.emails_suscriptores() to service_role;

-- Datos para armar el mail de confirmación (service_role: lo usa la ruta /api).
create or replace function public.suscriptor_por_token(p_token uuid)
returns table (email text, nombre text, confirmado boolean)
language sql security definer set search_path = public stable as $$
  select s.email, s.nombre, s.confirmado
  from public.suscriptores s where s.confirmacion_token = p_token limit 1;
$$;
revoke all on function public.suscriptor_por_token(uuid) from public, anon, authenticated;
grant execute on function public.suscriptor_por_token(uuid) to service_role;
