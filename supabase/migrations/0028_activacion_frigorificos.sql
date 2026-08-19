-- ============================================================================
-- DeCarnes · 0028 · Activación de frigoríficos verificados sin lotes
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
-- No toca el sistema de publicación ni ninguna policy existente.
-- ============================================================================

-- 1) Marcas de los avisos ya enviados. Sin esto el cron reenviaría el mismo
--    mail cada vez que corre. `verificado_at` ya existe y sirve de reloj.
alter table public.usuarios
  add column if not exists aviso_activacion_24h_at timestamptz,
  add column if not exists aviso_activacion_72h_at timestamptz;

-- 2) Funnel de frigoríficos: registrado → verificado → primer lote publicado.
--    Cuenta lotes PUBLICADOS: un borrador todavía no le sirve a ningún comprador.
create or replace function public.frigorificos_funnel()
returns table (
  registrados bigint, verificados bigint, verificados_sin_lotes bigint,
  con_lotes bigint, con_3_lotes bigint)
language sql security definer set search_path = public stable as $$
  with f as (
    select coalesce(u.verificado, false) as verificado,
           (select count(*) from public.lotes l
             where l.user_id = u.id and l.publico = true) as publicados
    from public.usuarios u
    where public.is_staff()
      and coalesce(u.rol_mercado, '') in ('vende', 'ambas')
      and u.estado = 'activo'
  )
  select count(*)::bigint,
         count(*) filter (where verificado)::bigint,
         count(*) filter (where verificado and publicados = 0)::bigint,
         count(*) filter (where publicados >= 1)::bigint,
         count(*) filter (where publicados >= 3)::bigint
  from f;
$$;
revoke all on function public.frigorificos_funnel() from public;
revoke execute on function public.frigorificos_funnel() from anon;
grant execute on function public.frigorificos_funnel() to authenticated;

-- 3) A quién le toca el recordatorio. Etapa '24h' o '72h'.
--    Condición de corte: NINGÚN lote, ni siquiera borrador. Al que ya empezó a
--    cargar no lo perseguimos: está adentro, solo no terminó.
--    Respeta recibir_avisos, igual que el resto de los mails.
create or replace function public.frigorificos_para_activar(p_etapa text)
returns table (id uuid, email text, empresa text, token uuid)
language sql security definer set search_path = public, auth stable as $$
  select u.id, au.email,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         u.avisos_token
  from public.usuarios u
    join auth.users au on au.id = u.id
  where p_etapa in ('24h', '72h')
    and u.estado = 'activo'
    and coalesce(u.verificado, false) = true
    and coalesce(u.rol_mercado, '') in ('vende', 'ambas')
    and u.recibir_avisos = true
    and au.email is not null
    and u.verificado_at is not null
    and u.verificado_at <= now() - (case p_etapa
          when '24h' then interval '24 hours'
          else interval '72 hours' end)
    and (case p_etapa
          when '24h' then u.aviso_activacion_24h_at
          else u.aviso_activacion_72h_at end) is null
    and not exists (select 1 from public.lotes l where l.user_id = u.id)
  limit 200;
$$;
revoke all on function public.frigorificos_para_activar(text) from public, anon, authenticated;
grant execute on function public.frigorificos_para_activar(text) to service_role;

-- 4) Deja constancia del envío (idempotencia del cron).
create or replace function public.marcar_aviso_activacion(p_user_id uuid, p_etapa text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_etapa = '24h' then
    update public.usuarios set aviso_activacion_24h_at = now() where id = p_user_id;
  elsif p_etapa = '72h' then
    update public.usuarios set aviso_activacion_72h_at = now() where id = p_user_id;
  end if;
end;
$$;
revoke all on function public.marcar_aviso_activacion(uuid, text) from public, anon, authenticated;
grant execute on function public.marcar_aviso_activacion(uuid, text) to service_role;

-- 5) Email de un frigorífico recién verificado, para el aviso inmediato.
create or replace function public.frigorifico_contacto(p_user_id uuid)
returns table (email text, empresa text, token uuid, verificado boolean, tiene_lotes boolean)
language sql security definer set search_path = public, auth stable as $$
  select au.email,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         u.avisos_token,
         coalesce(u.verificado, false),
         exists (select 1 from public.lotes l where l.user_id = u.id)
  from public.usuarios u
    join auth.users au on au.id = u.id
  where u.id = p_user_id and u.recibir_avisos = true
  limit 1;
$$;
revoke all on function public.frigorifico_contacto(uuid) from public, anon, authenticated;
grant execute on function public.frigorifico_contacto(uuid) to service_role;
