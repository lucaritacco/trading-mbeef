-- ============================================================================
-- DeCarnes · 0002 · Flujo en dos etapas (cotización primero, legajo después)
-- ----------------------------------------------------------------------------
-- CÓMO APLICARLO:  Supabase → SQL Editor → New query → pegar TODO → Run.
-- Idempotente y NO borra datos. A las filas existentes les pone los defaults.
-- ============================================================================

-- 1) Estado del legajo de aptitud. La fila nace en 'pendiente' (Etapa A) y pasa
--    a 'completo' cuando el proveedor carga la documentación (Etapa B).
alter table public.lotes
  add column if not exists legajo_estado text not null default 'pendiente';

-- 2) Consentimiento de contacto que se acepta en la Etapa A.
alter table public.lotes
  add column if not exists acepta_contacto boolean not null default false;

-- (Los campos de empresa y documentación ya son nullable desde 0001_init.sql:
--  la fila se puede crear solo con los datos de cotización de la Etapa A.)

-- 3) RLS: permitir que la Etapa B (rol anon) COMPLETE el legajo de UN lote por su id.
--    · El id es un UUID que funciona como link/llave única por lote.
--    · 'using (legajo_estado = pendiente)' = solo se puede actualizar mientras el
--      legajo está pendiente; una vez completo queda bloqueado (un link filtrado
--      no puede sobrescribir un legajo ya cerrado).
--    · NO se agrega ninguna política de SELECT: anon sigue sin poder leer la tabla.
drop policy if exists "lotes anon completar legajo" on public.lotes;
create policy "lotes anon completar legajo" on public.lotes
  for update to anon
  using (legajo_estado = 'pendiente')
  with check (true);
