-- ============================================================================
-- DeCarnes · 0013 · Emails para notificaciones (solo service_role)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Dos funciones para que el SERVIDOR (rutas API con service_role) pueda mandar
-- avisos por email. Leen auth.users, así que quedan restringidas a service_role:
-- anon y authenticated NO pueden ejecutarlas (no se filtran emails al navegador).
-- ============================================================================

-- Emails de todos los usuarios de beta activos (para el broadcast de "nuevo lote").
-- p_excluir: opcional, para no avisarle al propio vendedor que publicó.
create or replace function public.emails_usuarios_activos(p_excluir uuid default null)
returns table (email text)
language sql security definer set search_path = public, auth stable as $$
  select u.email
  from public.usuarios usr
  join auth.users u on u.id = usr.id
  where usr.estado = 'activo'
    and u.email is not null
    and (p_excluir is null or usr.id <> p_excluir);
$$;
revoke all on function public.emails_usuarios_activos(uuid) from public, anon, authenticated;
grant execute on function public.emails_usuarios_activos(uuid) to service_role;

-- Email del dueño de un lote (para avisarle de una consulta).
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
