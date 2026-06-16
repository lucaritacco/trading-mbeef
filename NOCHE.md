# NOCHE.md — Trabajo autónomo (ficha pública + scorecard + compradores)

Resumen de lo construido sin supervisión. **Hay 2 migraciones SQL que tenés
que correr vos a mano** (no las ejecuté). Todo está commiteado y pusheado a `main`.

---

## ⚠️ LO PRIMERO: correr 2 migraciones en Supabase

Supabase → **SQL Editor** → New query → pegar cada bloque → **Run**.
Son **aditivas**: no borran ni modifican datos existentes.

### Migración A — Ficha pública (`supabase/migrations/0005_ficha_publica.sql`)

Qué hace:
- Agrega la columna `publico boolean default false` a `lotes` (qué lote se ve público).
- Crea la función `get_ficha_publica(id)`: devuelve **solo columnas comerciales
  seguras** y **solo** si el lote es `publico = true`. Es el único acceso público
  a un lote; la tabla `lotes` NO se abre a lectura.
- Crea `es_lote_publico(id)` + una policy de Storage para que anon pueda ver
  (firmar) **solo las fotos de lotes públicos**.

```sql
alter table public.lotes
  add column if not exists publico boolean not null default false;

create or replace function public.get_ficha_publica(p_id uuid)
returns table (
  id uuid, created_at timestamptz, tipo_producto text, especie_categoria text,
  cortes text[], cortes_otro text, kilos_totales numeric, piezas_cajas integer,
  lote_estado text, envasado_tipo text, envasado_marca text, fecha_faena date,
  fecha_vencimiento date, ubicacion_provincia text, ubicacion_localidad text,
  observaciones_calidad text, fotos_paths text[]
)
language sql security definer set search_path = public stable as $$
  select id, created_at, tipo_producto, especie_categoria, cortes, cortes_otro,
         kilos_totales, piezas_cajas, lote_estado, envasado_tipo, envasado_marca,
         fecha_faena, fecha_vencimiento, ubicacion_provincia, ubicacion_localidad,
         observaciones_calidad, fotos_paths
  from public.lotes where id = p_id and publico = true;
$$;
revoke all on function public.get_ficha_publica(uuid) from public;
grant execute on function public.get_ficha_publica(uuid) to anon, authenticated;

create or replace function public.es_lote_publico(p_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.lotes where id::text = p_id and publico = true);
$$;
grant execute on function public.es_lote_publico(text) to anon, authenticated;

drop policy if exists "publico lee fotos de lotes publicos" on storage.objects;
create policy "publico lee fotos de lotes publicos" on storage.objects
  for select to anon
  using (bucket_id = 'lotes-fotos' and public.es_lote_publico((storage.foldername(name))[1]));
```

### Migración B — Compradores (`supabase/migrations/0006_compradores.sql`)

Qué hace: crea la tabla interna `compradores` con RLS **solo staff** (anon no la
alcanza por ninguna ruta).

```sql
create table if not exists public.compradores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  contacto text, cortes_busca text, volumenes text, frecuencia text,
  precio_max numeric, plazo_habitual text, linea_credito numeric, notas text
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
```

> El archivo `supabase/schema.sql` ya quedó actualizado con TODO el estado final
> (por si alguna vez querés reconstruir de cero), pero para tu base existente
> alcanza con correr los dos bloques de arriba.

---

## Qué quedó hecho

### Tarea 1 — Ficha pública de lote `/lote/[id]` (commit "Tarea 1")
- Página pública sin login. Muestra **solo** datos comerciales: tipo, especie,
  cortes, kilos/piezas, estado, envasado, fechas, ubicación, observaciones y fotos.
- **Nunca** expone: proveedor, razón social, CUIT, contacto, precios (origen ni
  pretendido), márgenes, oferta, legajo ni análisis interno. (Ver "Seguridad".)
- Botón grande de WhatsApp "Consultar este lote" con el número de referencia
  precargado; **sin precios**.
- **Open Graph del lado del servidor** (`generateMetadata`): título
  "Lote [tipo] · [kg] · [provincia] — DeCarnes", descripción y primera foto como
  imagen OG, para preview lindo en WhatsApp.
- Visibilidad controlada: la ficha da **404** si el lote no está `publico`.
- En el panel, detalle del lote: nuevo **toggle "Publicar ficha"** (enciende/apaga
  `publico`) + link para ver/compartir la ficha.

### Tarea 2 — Scorecard + compradores (commit "Tarea 2")
- **Scorecard de proveedor** en el detalle del lote: agregado por CUIT sobre
  `lotes` (publicados / ofertados / concretados) + notas de calidad acumuladas.
  Es lectura agregada, no duplica datos.
- **Registro de compradores** en `/panel/compradores`: CRUD (alta, edición,
  borrado) sobre la tabla `compradores`, con buscador (nombre / cortes / notas)
  para matching manual. Link "Compradores" agregado a la nav del panel.

---

## Seguridad (revisar y confirmar)
- **Ficha pública**: el acceso público pasa SOLO por `get_ficha_publica()`, que
  selecciona a mano las columnas seguras y filtra `publico = true`. No agregué
  ninguna policy de SELECT sobre `lotes` para anon: la tabla sigue cerrada.
  Revisá la lista de columnas en `0005_ficha_publica.sql` y en `lib/ficha.ts`
  (tipo `FichaPublica`): ningún campo sensible está incluido.
- **Fotos públicas**: bucket sigue privado; anon solo puede firmar fotos de lotes
  públicos (policy con `es_lote_publico`). Las URLs de imagen son firmadas y
  expiran a los 7 días (ver TODO sobre OG más abajo).
- **Compradores**: RLS solo `authenticated` + `is_staff()`. anon no la lee ni escribe.
- No toqué políticas RLS existentes ni la conexión. No hay credenciales en el repo.

---

## TODOs / pendientes documentados
- **Notificación al equipo** (de antes): sigue como no-op en `lib/notify.ts`.
  Falta elegir proveedor de email (ej. Resend) o un webhook de Supabase.
- **OG image con expiración**: la imagen OG usa una URL firmada de 7 días. Si una
  preview de WhatsApp se abre pasado ese plazo y no estaba cacheada, la imagen
  podría no cargar. Para algo permanente habría que: (a) un bucket público solo
  para portadas de lotes publicados, o (b) un endpoint propio que sirva la imagen.
  Lo dejé como mejora futura para no abrir el bucket entero.
- **`metadataBase`**: Next muestra un warning de `metadataBase` no seteado. Para
  producción conviene setearlo (al dominio real) en `app/layout.tsx`. No lo toqué
  para no asumir el dominio. Las OG de fotos usan URL absoluta de Supabase, así
  que igual funcionan.
- **Datos reales de marca** (de antes): URL MBEEF, CUIT, `[HISTORIA MBEEF]`, fotos
  propias, redacción de la garantía de cobro.

---

## Cómo probar (después de correr las 2 migraciones)

### Ficha pública
1. Generá un lote desde `/publicar` (o usá uno existente).
2. Entrá al panel → ese lote → activá el toggle **"Publicar ficha"**.
3. Abrí el link **"Ver / compartir ficha"** (o `/lote/<id>`): tenés que ver solo
   datos comerciales + fotos + botón de WhatsApp. **Verificá que NO aparezca**
   ningún dato de contacto, CUIT, precio ni nota interna.
4. Apagá el toggle y recargá `/lote/<id>`: debe dar **404**.
5. OG: en el HTML de `/lote/<id>` (Ctrl+U) buscá las etiquetas `og:title`,
   `og:description`, `og:image` (deben estar en el HTML del servidor). Probá el
   link en un chat de WhatsApp para ver la preview.

### Scorecard
- En el detalle de un lote cuyo proveedor (CUIT) tenga varios lotes, mirá la
  tarjeta **"Historial del proveedor"** (publicados / ofertados / concretados +
  notas). Para verlo con números, cargá 2-3 lotes con el mismo CUIT y movelos de
  estado en el pipeline.

### Compradores
- `/panel/compradores`: cargá uno con **"Nuevo comprador"**, buscá por corte o
  nombre, entrá a editarlo y probá guardar y eliminar.
- Si ves un aviso "¿Corriste la migración 0006?", es que falta correr la
  Migración B.

---

## Limpieza aparte (no la hice)
Quedaron filas de prueba en `lotes` de los tests anteriores. Si querés limpiarlas,
borralas desde **Table Editor**. No las toqué para no modificar datos.
