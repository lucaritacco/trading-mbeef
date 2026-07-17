# TANDA 6 · Catálogo público (ver y consultar lotes sin iniciar sesión)

Antes: el catálogo solo se veía logueado (`/cuenta/mercado`); lo único público era
la ficha individual `/lote/[id]`. Ahora hay un **catálogo público** navegable sin
login, y cada lote lleva a su ficha pública (donde se consulta).

## ⚠️ Migración a correr (vos, a mano)

`supabase/migrations/0010_catalogo_publico.sql` (también en `schema.sql`).
Aditiva, no borra datos. Pegá en Supabase → SQL Editor → Run:

```sql
create or replace function public.catalogo_publico(
  p_corte text default null, p_provincia text default null, p_estado text default null, p_q text default null)
returns table (
  id uuid, titulo text, corte text, especie_categoria text, lote_estado text,
  precio_pretendido_kg numeric, kilos_totales numeric, piezas_cajas integer, moq numeric,
  modalidad_entrega text, envasado_tipo text, certificados text[],
  ubicacion_provincia text, ubicacion_localidad text, created_at timestamptz, foto_principal text)
language sql security definer set search_path = public stable as $$
  select l.id, l.titulo, l.corte, l.especie_categoria, l.lote_estado,
         l.precio_pretendido_kg, l.kilos_totales, l.piezas_cajas, l.moq,
         l.modalidad_entrega, l.envasado_tipo, l.certificados,
         l.ubicacion_provincia, l.ubicacion_localidad, l.created_at, (l.fotos_paths)[1]
  from public.lotes l
  where l.publico = true and l.user_id is not null
    and (l.publicado_hasta is null or l.publicado_hasta >= current_date)
    and (p_corte is null or l.corte = p_corte)
    and (p_provincia is null or l.ubicacion_provincia = p_provincia)
    and (p_estado is null or l.lote_estado = p_estado)
    and (p_q is null or l.titulo ilike '%'||p_q||'%' or l.descripcion ilike '%'||p_q||'%')
  order by l.created_at desc limit 200;
$$;
revoke all on function public.catalogo_publico(text, text, text, text) from public;
grant execute on function public.catalogo_publico(text, text, text, text) to anon, authenticated;
```

## Qué se construyó

- **`/mercado`** (público, sin login): lista los lotes publicados con foto, título,
  corte, kg, provincia y precio; filtros por corte/provincia/estado + buscador.
  Cada tarjeta lleva a la **ficha pública `/lote/[id]`**, donde se ven los detalles
  y está el botón "Consultar" (WhatsApp a MBEEF con la referencia del lote).
- **Menú de la landing**: se agregó el link **"Mercado"** (header + menú móvil). De
  paso, los links de sección ahora son `/#…` para que funcionen desde cualquier
  página (antes solo servían en el home).

## Decisiones de diseño / seguridad

- **Público vs. logueado**: en `/mercado` (público) se ve el **producto** pero NO
  la empresa vendedora, y la consulta va al **WhatsApp de MBEEF** (vía la ficha).
  Así MBEEF queda como intermediario y no se exponen los números de los vendedores
  a cualquiera. En `/cuenta/mercado` (logueado) sí se ve la empresa y se contacta
  al dueño directo.
- **Seguridad de datos**: la función `catalogo_publico()` (SECURITY DEFINER)
  devuelve solo columnas comerciales — **sin `user_id`, sin teléfono, sin empresa,
  sin columnas internas**. Solo lotes con `publico = true` y no vencidos.
- No se tocó ninguna RLS existente ni el catálogo interno.

## Cómo probar (después de la migración)
1. Publicá un lote desde `/cuenta/publicar` (con `publico` activo).
2. En una **ventana de incógnito** (sin login) abrí **`/mercado`** → tenés que ver
   el lote. Probá los filtros.
3. Clic en el lote → `/lote/[id]` → botón de WhatsApp (a MBEEF). Todo sin login.
