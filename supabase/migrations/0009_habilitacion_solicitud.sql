-- ============================================================================
-- DeCarnes · 0009 · N° de habilitación (SENASA/provincial/municipal) en el alta
-- ----------------------------------------------------------------------------
-- ADITIVA: no borra datos. Pegar en Supabase → SQL Editor → Run.
-- Se completa solo para roles que venden (vende/ambas); el staff lo verifica a
-- mano contra el registro antes de aprobar. RLS ya cubierta (anon insert / staff
-- select), no hace falta tocar políticas.
-- ============================================================================

alter table public.solicitudes_beta
  add column if not exists habilitacion_nro text;
