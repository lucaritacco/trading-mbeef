-- ============================================================================
-- DeCarnes · 0004 · Panel interno (núcleo operativo)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Da acceso de lectura/edición al EQUIPO (rol authenticated y solo si su email
-- está en la lista `staff`). Anon sigue igual (formulario público).
-- ============================================================================

-- 1) Campos internos del lote (los carga el equipo en el panel)
alter table public.lotes
  add column if not exists margen_bruto_pct numeric,
  add column if not exists oferta_monto      numeric,
  add column if not exists oferta_plazo_dias integer,
  add column if not exists oferta_modo       text,   -- 'firme' | 'comision'
  add column if not exists resultado         text,
  add column if not exists notas_internas    text;

-- 2) Configuración (una sola fila): umbrales del semáforo + tasa anual
create table if not exists public.config (
  id              boolean primary key default true,
  umbral_pasar    numeric not null default 10,   -- margen < umbral_pasar  => pasar
  umbral_comision numeric not null default 14,   -- entre ambos => comisión; > => evaluar compra firme
  tasa_anual      numeric not null default 35,   -- % anual para el contado equivalente
  constraint config_fila_unica check (id)
);
insert into public.config (id) values (true) on conflict (id) do nothing;

-- 3) Lista blanca del equipo + función is_staff()
create table if not exists public.staff (email text primary key);
alter table public.staff enable row level security;  -- sin políticas: nadie la lee directo

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.staff where email = auth.email());
$$;
grant execute on function public.is_staff() to authenticated;

-- 4) RLS para el equipo
alter table public.config enable row level security;

drop policy if exists "lotes staff select" on public.lotes;
create policy "lotes staff select" on public.lotes
  for select to authenticated using (public.is_staff());

drop policy if exists "lotes staff update" on public.lotes;
create policy "lotes staff update" on public.lotes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "config staff select" on public.config;
create policy "config staff select" on public.config
  for select to authenticated using (public.is_staff());

drop policy if exists "config staff update" on public.config;
create policy "config staff update" on public.config
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- 5) Storage: el equipo puede LEER documentos y fotos (para verlos en el panel)
drop policy if exists "staff lee documentos" on storage.objects;
create policy "staff lee documentos" on storage.objects
  for select to authenticated using (bucket_id = 'documentos' and public.is_staff());

drop policy if exists "staff lee lotes-fotos" on storage.objects;
create policy "staff lee lotes-fotos" on storage.objects
  for select to authenticated using (bucket_id = 'lotes-fotos' and public.is_staff());

-- 6) Tu email como staff (agregá acá a cada persona del equipo)
insert into public.staff (email) values ('lucarita2006@gmail.com') on conflict do nothing;
