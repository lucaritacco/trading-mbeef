-- ============================================================================
-- DeCarnes · 0006 · Alta de beta con aprobación manual (`solicitudes_beta`)
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra ni modifica datos. Pegar en Supabase → SQL Editor → Run.
-- Requiere que ya exista la función public.is_staff() (migración del panel).
--
-- Modelo: cualquiera puede dejar su alta en /sumate (anon INSERT). Queda
-- 'pendiente' hasta que el staff la apruebe/rechace desde el panel. Anon NUNCA
-- puede leer ni modificar la tabla. NO se envían mails (aviso manual por fuera).
-- ============================================================================

create table if not exists public.solicitudes_beta (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  nombre_contacto text,
  empresa         text,
  cuit            text,
  rol             text,   -- 'vende' | 'compra' | 'ambas'
  contacto        text,   -- WhatsApp o email
  notas           text,
  estado          text not null default 'pendiente'  -- 'pendiente' | 'aprobada' | 'rechazada'
);

alter table public.solicitudes_beta enable row level security;

-- anon: SOLO insertar (mismo patrón que `lotes`). No puede leer/editar/borrar.
drop policy if exists "solicitudes anon insert" on public.solicitudes_beta;
create policy "solicitudes anon insert" on public.solicitudes_beta
  for insert to anon with check (true);

-- staff (authenticated + is_staff): leer y cambiar el estado.
drop policy if exists "solicitudes staff select" on public.solicitudes_beta;
create policy "solicitudes staff select" on public.solicitudes_beta
  for select to authenticated using (public.is_staff());

drop policy if exists "solicitudes staff update" on public.solicitudes_beta;
create policy "solicitudes staff update" on public.solicitudes_beta
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
