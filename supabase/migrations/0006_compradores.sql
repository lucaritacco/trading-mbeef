-- ============================================================================
-- DeCarnes · 0006 · Registro de demanda de compradores (item B2)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
-- Tabla interna del panel. RLS: SOLO staff lee/escribe. anon nunca la alcanza.
-- ============================================================================

create table if not exists public.compradores (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  nombre         text not null,
  contacto       text,
  cortes_busca   text,        -- qué cortes busca (texto libre, buscable)
  volumenes      text,
  frecuencia     text,
  precio_max     numeric,
  plazo_habitual text,
  linea_credito  numeric,
  notas          text
);

alter table public.compradores enable row level security;

drop policy if exists "compradores staff select" on public.compradores;
create policy "compradores staff select" on public.compradores
  for select to authenticated using (public.is_staff());

drop policy if exists "compradores staff insert" on public.compradores;
create policy "compradores staff insert" on public.compradores
  for insert to authenticated with check (public.is_staff());

drop policy if exists "compradores staff update" on public.compradores;
create policy "compradores staff update" on public.compradores
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "compradores staff delete" on public.compradores;
create policy "compradores staff delete" on public.compradores
  for delete to authenticated using (public.is_staff());
