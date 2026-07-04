# TANDA 5 · Requisitos de vendedor, habilitación en el alta, y foto del respaldo

Solo landing + alta + un dato visible en el panel. No se tocó el login, el
catálogo, ni la lógica del panel de staff (solo se muestra una columna nueva).

## ⚠️ Migración a correr (vos, a mano)

`supabase/migrations/0009_habilitacion_solicitud.sql` (también en `schema.sql`).
Aditiva, no borra datos. Pegá en Supabase → SQL Editor → Run:

```sql
alter table public.solicitudes_beta
  add column if not exists habilitacion_nro text;
```

La RLS ya cubre la columna (anon insert / staff select), no hace falta tocar
políticas.

## 1. Landing — "Para quién es" (Requirements.tsx)
- Intro: "Trabajamos con vendedores habilitados. Para publicar necesitás:".
- Lista reducida a **dos**: "Habilitación sanitaria vigente (SENASA, provincial o
  municipal, según tu operación)" y "CUIT activo".
- Eliminados: "Inscripción RUCA" y "Producto con trazabilidad".
- Línea nueva bajo la lista: "¿Solo comprás? Sumate igual: no necesitás
  habilitación para navegar el mercado."
- Cierre "¿Cumplís? Sumate al mercado." y CTA: sin cambios.

## 2. Alta (/sumate) — habilitación para vendedores
- Campo "N° de habilitación / establecimiento (SENASA, provincial o municipal)"
  que aparece **solo** si el rol es "Vendo carne" o "Ambas". Para "Compro carne"
  no se muestra ni se guarda.
- Obligatorio para vende/ambas, texto libre, sin validación externa (el staff lo
  verifica a mano contra el registro antes de aprobar).
- Se guarda en `solicitudes_beta.habilitacion_nro` (nullable).
- Se muestra en **/panel/solicitudes** (columna "Habilitación") para que el staff
  lo chequee antes de aprobar.
- Perfil de empresa (/cuenta/empresa): ya tenía "habilitación sanitaria: tipo +
  número" (tanda 4). No se duplicó nada; el dato del alta se ve desde el panel.

## 3. Foto del bloque "Respaldo MBEEF"
- Reemplazada la imagen de vacas por una foto de **producto**: cortes de carne
  vacuna sobre tabla de carnicero, estética oscura y sobria (combina con
  carbón/bordó), sin personas ni marcas.
- Archivo descargado al proyecto (no hotlink): `public/images/producto.jpg`.
  Se eliminó `campo.jpg`. Alt nuevo: "Cortes de carne vacuna sobre tabla de
  carnicero".
- **Fuente y licencia**: Unsplash — foto `photo-1603048297172-c92544798d5a`
  (https://unsplash.com/photos/... , servida vía images.unsplash.com).
  **Unsplash License**: uso comercial permitido, **sin atribución obligatoria**.
  (Nota: es la misma imagen que se usa como Open Graph `hero.jpg`, que no se ve en
  la página; en la landing visible aparece una sola vez, en el respaldo.)

## Criterios
- ✅ La landing pide solo habilitación sanitaria + CUIT, aclarando que es para
  vendedores; RUCA y trazabilidad eliminados; aclaración para compradores.
- ✅ El alta muestra el campo de habilitación solo para vende/ambas y el staff lo
  ve en /panel/solicitudes.
- ✅ Foto nueva de producto, de stock libre (Unsplash), fuente y licencia
  documentadas.
- ✅ Migración documentada para correr a mano.
