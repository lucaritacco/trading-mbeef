-- ============================================================================
-- DeCarnes · 0021 · Frigorífico verificado + alta autoservicio de comprador
-- ----------------------------------------------------------------------------
-- ADITIVA en datos, pero CIERRA UN PERMISO. Pegar en Supabase → SQL Editor → Run.
--
-- Contexto: hasta ahora toda cuenta llegaba por invitación, así que "estar
-- logueado" implicaba "estar aprobado" y la política de publicar lotes solo
-- pedía user_id = auth.uid(). Al abrir el registro de compradores esa premisa se
-- cae: cualquiera podría crear cuenta y publicar llamando a la API directo.
--
-- Solución: el sello "verificado" y el permiso de publicar son lo mismo.
--   · Comprador: se registra solo, ve precios y catálogo. NO publica.
--   · Frigorífico: lo verifica MBEEF a mano. Publica y muestra el sello.
-- ============================================================================

-- 1) Verificación del frigorífico (la activa el staff desde el panel).
alter table public.usuarios
  add column if not exists verificado boolean not null default false,
  add column if not exists verificado_at timestamptz;

-- El staff puede marcar/desmarcar la verificación.
drop policy if exists "usuarios staff update" on public.usuarios;
create policy "usuarios staff update" on public.usuarios
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- 2) CIERRE DE PERMISO: publicar exige ser vendedor verificado.
--    Antes: cualquier usuario autenticado podía insertar un lote a su nombre.
drop policy if exists "lotes beta insert" on public.lotes;
create policy "lotes vendedor insert" on public.lotes
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.usuarios u
      where u.id = auth.uid()
        and u.verificado = true
        and u.estado = 'activo'
        and coalesce(u.rol_mercado, '') in ('vende', 'ambas')
    )
  );

-- Editar el lote propio también exige seguir verificado (si se le quita la
-- verificación, deja de poder tocar sus publicaciones).
drop policy if exists "lotes own update" on public.lotes;
create policy "lotes own update" on public.lotes
  for update to authenticated using (
    user_id = auth.uid()
    and exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.verificado = true and u.estado = 'activo'
    )
  ) with check (user_id = auth.uid());

-- 3) Alta autoservicio de comprador: crea su fila en `usuarios` con rol 'compra'.
--    Nunca verificado, así que no puede publicar. Idempotente: si ya tiene fila,
--    no la pisa (para no degradar a un vendedor que vuelva a llamar).
create or replace function public.crear_cuenta_comprador(p_empresa text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    return true;
  end if;
  insert into public.usuarios (id, empresa, rol_mercado, estado, verificado)
    values (auth.uid(), nullif(btrim(p_empresa), ''), 'compra', 'activo', false);
  return true;
end;
$$;
revoke all on function public.crear_cuenta_comprador(text) from public;
revoke execute on function public.crear_cuenta_comprador(text) from anon;
grant execute on function public.crear_cuenta_comprador(text) to authenticated;

-- 4) El catálogo y la ficha exponen `verificado` como booleano del lote.
--    Es un sello, no identifica al frigorífico: no viaja nombre, cuit ni user_id.
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
  where l.publico = true and l.user_id is not null
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
  where l.id = p_id and l.publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

-- 5) Marcar los frigoríficos que ya publicaron como verificados: entraron por
--    invitación aprobada a mano, que es exactamente el criterio de verificación.
update public.usuarios u
set verificado = true, verificado_at = now()
where verificado = false
  and exists (select 1 from public.lotes l where l.user_id = u.id);
