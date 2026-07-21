-- ============================================================================
-- DeCarnes · 0014 · Preferencia de avisos (opt-out) + email obligatorio en alta
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
--   · usuarios: recibir_avisos (default true) + avisos_token (para link de baja).
--   · solicitudes_beta: whatsapp opcional (el contacto pasa a ser el email).
--   · emails_usuarios_activos: filtra por recibir_avisos y devuelve el token de baja.
-- ============================================================================

-- 1) Preferencia de avisos por usuario + token para el enlace de baja del email.
alter table public.usuarios
  add column if not exists recibir_avisos boolean not null default true,
  add column if not exists avisos_token uuid not null default gen_random_uuid();

create unique index if not exists usuarios_avisos_token_idx
  on public.usuarios (avisos_token);

-- 2) WhatsApp opcional en el alta (el campo `contacto` guarda el email obligatorio).
alter table public.solicitudes_beta
  add column if not exists whatsapp text;

-- 3) Emails para el broadcast: solo usuarios que quieren avisos, con su token de baja.
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
