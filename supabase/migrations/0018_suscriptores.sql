-- ============================================================================
-- DeCarnes · 0018 · Suscriptores de avisos (alta liviana: nombre + email)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Público de traders/retailers que solo quieren enterarse de los lotes nuevos,
-- sin registrar empresa ni CUIT. Se suman por /enterate (nombre + email) y entran
-- al mismo mail automático de "lote nuevo" que ya existe.
-- ============================================================================

create table if not exists public.suscriptores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text,
  email text not null unique,
  baja boolean not null default false,
  baja_token uuid not null default gen_random_uuid()
);
alter table public.suscriptores enable row level security;

create unique index if not exists suscriptores_baja_token_idx on public.suscriptores (baja_token);

-- El alta entra SOLO por la función suscribir(); no hay INSERT directo para anon.
-- El staff puede leer la lista.
drop policy if exists "suscriptores staff select" on public.suscriptores;
create policy "suscriptores staff select" on public.suscriptores
  for select to authenticated using (public.is_staff());

-- Alta pública: upsert por email. Si ya existía y estaba dado de baja, lo reactiva.
create or replace function public.suscribir(p_nombre text, p_email text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email invalido';
  end if;
  insert into public.suscriptores (nombre, email)
    values (nullif(btrim(p_nombre), ''), lower(btrim(p_email)))
  on conflict (email) do update
    set baja = false,
        nombre = coalesce(excluded.nombre, public.suscriptores.nombre);
end;
$$;
revoke all on function public.suscribir(text, text) from public;
grant execute on function public.suscribir(text, text) to anon, authenticated;

-- Emails de suscriptores activos para el broadcast (solo service_role). Excluye a
-- quienes ya reciben el aviso como usuarios de beta, para no mandar el mail doble.
create or replace function public.emails_suscriptores()
returns table (email text, token uuid)
language sql security definer set search_path = public, auth stable as $$
  select s.email, s.baja_token
  from public.suscriptores s
  where s.baja = false and s.email is not null
    and not exists (
      select 1 from public.usuarios u join auth.users au on au.id = u.id
      where lower(au.email) = s.email and u.estado = 'activo' and u.recibir_avisos = true
    );
$$;
revoke all on function public.emails_suscriptores() from public, anon, authenticated;
grant execute on function public.emails_suscriptores() to service_role;
-- La baja se hace desde /avisos con el service_role directo sobre la tabla
-- (mismo patrón que usuarios), buscando por baja_token.
