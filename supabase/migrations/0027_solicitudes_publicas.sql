-- ============================================================================
-- DeCarnes · 0027 · Solicitudes públicas, avisos a frigoríficos y eventos
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
-- No toca `busquedas` ni `ofertas` salvo una columna opcional, ni cambia una
-- sola de las políticas de aislamiento existentes.
-- ============================================================================

-- 1) Detalle PÚBLICO de una solicitud aprobada, anonimizado.
--    busqueda_ver() exige sesión, así que hacía falta esta para /solicitudes/[id]
--    sin cuenta. Devuelve solo lo comercial: nunca comprador, empresa ni contacto.
--    `notas` queda afuera a propósito: es texto libre y puede identificar.
create or replace function public.solicitud_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text, ofertas_count bigint)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria,
         b.cantidad_kg, b.provincia, b.plazo_necesario,
         (select count(*) from public.ofertas o where o.busqueda_id = b.id)
  from public.busquedas b
  where b.id = p_id and b.estado = 'abierta'
  limit 1;
$$;
revoke all on function public.solicitud_publica(uuid) from public;
grant execute on function public.solicitud_publica(uuid) to anon, authenticated;

-- La vitrina pública ya existía; se le suma el conteo de ofertas para poder
-- mostrar señal de actividad, sin exponer quién ofertó.
drop function if exists public.solicitudes_publicas(integer);
create function public.solicitudes_publicas(p_limite integer default 6)
returns table (
  id uuid, created_at timestamptz, tipo_corte text, especie_categoria text,
  cantidad_kg numeric, provincia text, plazo_necesario text, ofertas_count bigint)
language sql security definer set search_path = public stable as $$
  select b.id, b.created_at, b.tipo_corte, b.especie_categoria,
         b.cantidad_kg, b.provincia, b.plazo_necesario,
         (select count(*) from public.ofertas o where o.busqueda_id = b.id)
  from public.busquedas b
  where b.estado = 'abierta'
  order by b.created_at desc
  limit greatest(1, least(coalesce(p_limite, 6), 60));
$$;
revoke all on function public.solicitudes_publicas(integer) from public;
grant execute on function public.solicitudes_publicas(integer) to anon, authenticated;

-- 2) Emails de frigoríficos verificados, para avisarles de una solicitud nueva.
--    emails_usuarios_activos() incluye compradores; acá solo van los que pueden
--    cotizar. Respeta la preferencia de avisos. Solo service_role.
create or replace function public.emails_frigorificos()
returns table (email text, token uuid)
language sql security definer set search_path = public, auth stable as $$
  select au.email, u.avisos_token
  from public.usuarios u join auth.users au on au.id = u.id
  where u.estado = 'activo' and u.verificado = true
    and coalesce(u.rol_mercado, '') in ('vende', 'ambas')
    and u.recibir_avisos = true
    and au.email is not null;
$$;
revoke all on function public.emails_frigorificos() from public, anon, authenticated;
grant execute on function public.emails_frigorificos() to service_role;

-- Datos de la solicitud para armar ese mail (sin comprador).
create or replace function public.solicitud_para_difusion(p_id uuid)
returns table (
  tipo_corte text, especie_categoria text, cantidad_kg numeric,
  provincia text, plazo_necesario text, estado text)
language sql security definer set search_path = public stable as $$
  select b.tipo_corte, b.especie_categoria, b.cantidad_kg,
         b.provincia, b.plazo_necesario, b.estado
  from public.busquedas b where b.id = p_id limit 1;
$$;
revoke all on function public.solicitud_para_difusion(uuid) from public, anon, authenticated;
grant execute on function public.solicitud_para_difusion(uuid) to service_role;

-- 3) Eventos del funnel. `visitas` guarda páginas vistas (path/lote_id) y no
--    tiene tipo de evento ni actor, así que no alcanza. Tabla propia y mínima.
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null,
  user_id uuid references auth.users(id) on delete set null,
  busqueda_id uuid references public.busquedas(id) on delete set null,
  lote_id uuid references public.lotes(id) on delete set null,
  meta jsonb
);
alter table public.eventos enable row level security;

create index if not exists eventos_tipo_fecha_idx on public.eventos (tipo, created_at desc);
create index if not exists eventos_busqueda_idx on public.eventos (busqueda_id);

drop policy if exists "eventos staff select" on public.eventos;
create policy "eventos staff select" on public.eventos
  for select to authenticated using (public.is_staff());

-- Alta por función: valida el tipo y ata el actor a la sesión real (nadie puede
-- registrar un evento a nombre de otro).
create or replace function public.registrar_evento(
  p_tipo text, p_busqueda_id uuid default null, p_lote_id uuid default null,
  p_meta jsonb default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_tipo not in (
    'request_created','request_approved','request_view','request_quote_started',
    'request_quote_sent','request_offer_accepted','request_closed','request_share',
    'whatsapp_unlocked'
  ) then
    return;
  end if;
  insert into public.eventos (tipo, user_id, busqueda_id, lote_id, meta)
  values (p_tipo, auth.uid(), p_busqueda_id, p_lote_id, p_meta);
end;
$$;
revoke all on function public.registrar_evento(text, uuid, uuid, jsonb) from public;
grant execute on function public.registrar_evento(text, uuid, uuid, jsonb) to anon, authenticated;

-- Resumen del funnel para el panel.
create or replace function public.eventos_resumen(p_horas integer default 168)
returns table (tipo text, cantidad bigint)
language sql security definer set search_path = public stable as $$
  select e.tipo, count(*)::bigint
  from public.eventos e
  where public.is_staff()
    and e.created_at >= now() - make_interval(hours => greatest(1, coalesce(p_horas, 168)))
  group by e.tipo order by count(*) desc;
$$;
revoke all on function public.eventos_resumen(integer) from public;
revoke execute on function public.eventos_resumen(integer) from anon;
grant execute on function public.eventos_resumen(integer) to authenticated;

-- 4) Lote opcional asociado a una oferta (conecta stock publicado con demanda).
alter table public.ofertas
  add column if not exists lote_id uuid references public.lotes(id) on delete set null;

-- crear_oferta acepta el lote. Valida que el lote sea DEL VENDEDOR que oferta:
-- si no, cualquiera podría colgarse del lote de otro.
create or replace function public.crear_oferta(
  p_busqueda_id uuid, p_precio numeric, p_cantidad numeric, p_plazo text,
  p_notas text, p_lote_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_dueno uuid; v_estado text;
begin
  if auth.uid() is null then raise exception 'sin sesion'; end if;
  select user_id, estado into v_dueno, v_estado from public.busquedas where id = p_busqueda_id;
  if v_dueno is null then raise exception 'busqueda inexistente'; end if;
  if v_estado <> 'abierta' then raise exception 'la busqueda esta cerrada'; end if;
  if v_dueno = auth.uid() then raise exception 'no podes ofertar tu propia busqueda'; end if;
  if p_lote_id is not null and not exists (
    select 1 from public.lotes l where l.id = p_lote_id and l.user_id = auth.uid()
  ) then
    raise exception 'el lote no es tuyo';
  end if;
  insert into public.ofertas (busqueda_id, user_id, precio_por_kg, cantidad_ofrecida_kg,
                              plazo_entrega, notas, lote_id)
    values (p_busqueda_id, auth.uid(), p_precio, p_cantidad, p_plazo, p_notas, p_lote_id)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.crear_oferta(uuid, numeric, numeric, text, text, uuid) from public;
revoke execute on function public.crear_oferta(uuid, numeric, numeric, text, text, uuid) from anon;
grant execute on function public.crear_oferta(uuid, numeric, numeric, text, text, uuid) to authenticated;

-- ofertas_de_busqueda suma el lote asociado (mismo aislamiento de siempre:
-- el dueño de la búsqueda ve todas, el vendedor solo las suyas).
create or replace function public.ofertas_de_busqueda(p_busqueda_id uuid)
returns table (
  id uuid, created_at timestamptz, precio_por_kg numeric, cantidad_ofrecida_kg numeric,
  plazo_entrega text, notas text, estado text, vendedor_empresa text, es_mia boolean,
  lote_id uuid, lote_titulo text)
language sql security definer set search_path = public stable as $$
  select o.id, o.created_at, o.precio_por_kg, o.cantidad_ofrecida_kg,
         o.plazo_entrega, o.notas, o.estado,
         coalesce(u.nombre_fantasia, u.razon_social, u.empresa),
         (o.user_id = auth.uid()),
         o.lote_id, l.titulo
  from public.ofertas o
    join public.usuarios u on u.id = o.user_id
    left join public.lotes l on l.id = o.lote_id
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

-- Lotes propios publicados, para elegir cuál asociar a la oferta.
create or replace function public.mis_lotes_para_oferta()
returns table (id uuid, titulo text, corte text, kilos_totales numeric, precio_pretendido_kg numeric)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.kilos_totales, l.precio_pretendido_kg
  from public.lotes l
  where l.user_id = auth.uid() and l.publico = true and l.vendido = false
  order by l.created_at desc limit 50;
$$;
revoke all on function public.mis_lotes_para_oferta() from public;
revoke execute on function public.mis_lotes_para_oferta() from anon;
grant execute on function public.mis_lotes_para_oferta() to authenticated;
