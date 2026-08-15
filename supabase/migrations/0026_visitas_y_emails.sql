-- ============================================================================
-- DeCarnes · 0026 · Registro de visitas + emails de las cuentas en el panel
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
-- Visitas: se guarda solo la página, el lote y de dónde vino. SIN IP, SIN cookie
-- y sin nada que identifique a la persona, así no hace falta cartel de consentimiento.
-- Por eso cuenta VISTAS, no visitantes únicos (para únicos está Vercel Analytics).
-- ============================================================================

create table if not exists public.visitas (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  lote_id uuid references public.lotes(id) on delete set null,
  referrer text
);
alter table public.visitas enable row level security;

create index if not exists visitas_fecha_idx on public.visitas (created_at desc);
create index if not exists visitas_lote_idx on public.visitas (lote_id);

-- Nadie lee la tabla directo salvo el staff. El alta entra solo por la función.
drop policy if exists "visitas staff select" on public.visitas;
create policy "visitas staff select" on public.visitas
  for select to authenticated using (public.is_staff());

-- Alta pública: la llama el navegador en cada página. Recorta los textos para
-- que nadie pueda inflar la tabla con cadenas largas.
create or replace function public.registrar_visita(
  p_path text, p_lote_id uuid default null, p_referrer text default null)
returns void
language sql security definer set search_path = public as $$
  insert into public.visitas (path, lote_id, referrer)
  values (left(coalesce(p_path, '/'), 300), p_lote_id, left(nullif(p_referrer, ''), 300));
$$;
revoke all on function public.registrar_visita(text, uuid, text) from public;
grant execute on function public.registrar_visita(text, uuid, text) to anon, authenticated;

-- Resumen para el panel: totales y las páginas más vistas.
create or replace function public.visitas_resumen(p_horas integer default 24)
returns table (
  vistas_periodo bigint, vistas_24h bigint, vistas_7d bigint, fichas_periodo bigint
)
language sql security definer set search_path = public stable as $$
  select
    count(*) filter (where v.created_at >= now() - make_interval(hours => greatest(1, coalesce(p_horas, 24)))),
    count(*) filter (where v.created_at >= now() - interval '24 hours'),
    count(*) filter (where v.created_at >= now() - interval '7 days'),
    count(*) filter (where v.lote_id is not null
                       and v.created_at >= now() - make_interval(hours => greatest(1, coalesce(p_horas, 24))))
  from public.visitas v
  where public.is_staff();
$$;
revoke all on function public.visitas_resumen(integer) from public;
revoke execute on function public.visitas_resumen(integer) from anon;
grant execute on function public.visitas_resumen(integer) to authenticated;

-- Páginas más vistas del período.
create or replace function public.visitas_top_paths(p_horas integer default 24, p_limite integer default 12)
returns table (path text, vistas bigint)
language sql security definer set search_path = public stable as $$
  select v.path, count(*)::bigint
  from public.visitas v
  where public.is_staff()
    and v.created_at >= now() - make_interval(hours => greatest(1, coalesce(p_horas, 24)))
  group by v.path order by count(*) desc
  limit greatest(1, least(coalesce(p_limite, 12), 50));
$$;
revoke all on function public.visitas_top_paths(integer, integer) from public;
revoke execute on function public.visitas_top_paths(integer, integer) from anon;
grant execute on function public.visitas_top_paths(integer, integer) to authenticated;

-- Lotes más vistos: para saber qué stock tira y qué no.
create or replace function public.visitas_top_lotes(p_horas integer default 24, p_limite integer default 10)
returns table (lote_id uuid, titulo text, corte text, vistas bigint)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, count(*)::bigint
  from public.visitas v join public.lotes l on l.id = v.lote_id
  where public.is_staff()
    and v.created_at >= now() - make_interval(hours => greatest(1, coalesce(p_horas, 24)))
  group by l.id, l.titulo, l.corte order by count(*) desc
  limit greatest(1, least(coalesce(p_limite, 10), 50));
$$;
revoke all on function public.visitas_top_lotes(integer, integer) from public;
revoke execute on function public.visitas_top_lotes(integer, integer) from anon;
grant execute on function public.visitas_top_lotes(integer, integer) to authenticated;

-- ============================================================================
-- Emails de las cuentas, para verlos en el panel (viven en auth.users).
-- ============================================================================
create or replace function public.cuentas_con_email()
returns table (
  id uuid, created_at timestamptz, email text, empresa text, rol_mercado text,
  estado text, verificado boolean, recibir_avisos boolean,
  provincia text, whatsapp text, foto_path text, descripcion text
)
language sql security definer set search_path = public, auth stable as $$
  select u.id, u.created_at, au.email,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         u.rol_mercado, u.estado, coalesce(u.verificado, false), u.recibir_avisos,
         u.provincia, u.whatsapp, u.foto_path, u.descripcion
  from public.usuarios u
    left join auth.users au on au.id = u.id
  where public.is_staff()
  order by u.created_at desc;
$$;
revoke all on function public.cuentas_con_email() from public;
revoke execute on function public.cuentas_con_email() from anon;
grant execute on function public.cuentas_con_email() to authenticated;
