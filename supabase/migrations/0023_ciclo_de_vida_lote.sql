-- ============================================================================
-- DeCarnes · 0023 · Ciclo de vida del lote + verificación al canjear invitación
-- ----------------------------------------------------------------------------
-- ADITIVA. Pegar en Supabase → SQL Editor → Run.
--
--  1. Al canjear una invitación el frigorífico queda VERIFICADO. Aprobar la
--     solicitud ya implica haber hablado con él y revisado los datos: sin esto
--     se registraba y no podía publicar, con un error de permisos incomprensible.
--  2. El lote pasa a tener estado comercial: publicado / pausado / vendido, con
--     los datos de la venta para el scorecard y las comisiones.
-- ============================================================================

-- 1) Canjear invitación deja al frigorífico verificado y listo para publicar.
create or replace function public.canjear_invitacion(p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if auth.uid() is null then
    return false;
  end if;
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
  -- La invitación solo se emite tras aprobar la solicitud a mano, que es el acto
  -- de verificación. Por eso entra verificado y puede publicar de una.
  insert into public.usuarios (id, solicitud_id, empresa, cuit, rol_mercado, verificado, verificado_at)
    values (auth.uid(), s.id, s.empresa, s.cuit, s.rol, true, now());
  update public.solicitudes_beta set invitacion_usada = true where id = s.id;
  return true;
end;
$$;
revoke all on function public.canjear_invitacion(uuid) from public;
grant execute on function public.canjear_invitacion(uuid) to authenticated;

-- 2) Datos de la venta en el lote.
alter table public.lotes
  add column if not exists vendido boolean not null default false,
  add column if not exists vendido_at timestamptz,
  add column if not exists venta_kg numeric,
  add column if not exists venta_precio_kg numeric,
  add column if not exists venta_notas text;

create index if not exists lotes_vendido_idx on public.lotes (vendido);

-- 3) Un lote vendido sale del catálogo público, aunque haya quedado `publico`.
drop function if exists public.catalogo_publico(text, text, text, text);
create function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, created_at timestamptz, foto_principal text,
  verificado boolean)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.created_at, (l.fotos_paths)[1],
         coalesce(u.verificado, false)
  from public.lotes l join public.usuarios u on u.id = l.user_id
  where l.publico = true and l.user_id is not null and l.vendido = false
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia
         or (p_provincia = 'Buenos Aires' and l.ubicacion_provincia = 'Ciudad Autónoma de Buenos Aires'))
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;

-- La ficha de un lote vendido deja de estar disponible (evita consultas sobre
-- algo que ya no está).
drop function if exists public.get_ficha_publica(uuid);
create function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, titulo text, corte text, descripcion text,
  tipo_producto text, especie_categoria text, cortes text[], cortes_otro text,
  kilos_totales numeric, piezas_cajas integer, moq numeric, modalidad_entrega text,
  lote_estado text, envasado_tipo text, envasado_marca text, certificados text[],
  fecha_faena date, fecha_vencimiento date,
  ubicacion_provincia text,
  observaciones_calidad text, fotos_paths text[],
  verificado boolean)
language sql security definer set search_path = public stable as $$
  select l.id, l.created_at, l.titulo, l.corte, l.descripcion,
         l.tipo_producto, l.especie_categoria, l.cortes, l.cortes_otro,
         l.kilos_totales, l.piezas_cajas, l.moq, l.modalidad_entrega,
         l.lote_estado, l.envasado_tipo, l.envasado_marca, l.certificados,
         l.fecha_faena, l.fecha_vencimiento, l.ubicacion_provincia,
         l.observaciones_calidad, l.fotos_paths,
         coalesce(u.verificado, false)
  from public.lotes l left join public.usuarios u on u.id = l.user_id
  where l.id = p_id and l.publico = true and l.vendido = false;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- 4) ¿Está verificado el usuario logueado? La usa /cuenta para avisar antes de
--    que intente publicar y se choque con un error de permisos.
create or replace function public.mi_estado_cuenta()
returns table (verificado boolean, rol_mercado text, empresa text)
language sql security definer set search_path = public stable as $$
  select u.verificado, u.rol_mercado, coalesce(u.nombre_fantasia, u.razon_social, u.empresa)
  from public.usuarios u where u.id = auth.uid() limit 1;
$$;
revoke all on function public.mi_estado_cuenta() from public;
revoke execute on function public.mi_estado_cuenta() from anon;
grant execute on function public.mi_estado_cuenta() to authenticated;
