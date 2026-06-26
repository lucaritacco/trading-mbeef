# TANDA 4 · Perfil de empresa, carga de lote, catálogo y contacto

Lo que el usuario aprobado hace dentro de `/cuenta`: completar su empresa,
publicar lotes (con fotos + especificaciones colapsables estilo MeatBorsa), ver el
catálogo de todos los lotes publicados, filtrar/buscar, y contactar al dueño por
WhatsApp. No se tocó `/panel`, el login, ni las RLS existentes (solo se agregaron
políticas nuevas, descritas abajo). El `/publicar` viejo quedó **redirigido** a la
carga nueva.

## ⚠️ Migración a correr (vos, a mano)

`supabase/migrations/0008_mercado.sql` (también en `supabase/schema.sql`, sección
10). Aditiva, no borra datos. Pegá el archivo entero en Supabase → SQL Editor →
Run. Agrega: columnas de perfil en `usuarios`, columnas de lote + `user_id` en
`lotes`, RLS de lotes para el dueño, políticas de Storage para subir/leer fotos,
y las funciones `catalogo()` y `contacto_lote()`.

> No hace falta tocar ningún setting de Auth en esta tanda.

## Decisiones (las pediste explícitas)

### Estado de publicación del lote
Al publicar, el lote entra **directo como publicado** (`publico = true`), sin cola
de aprobación, para no frenar la beta. El control queda con el campo `publico` que
ya existía (de la ficha pública): el **staff puede despublicar** un lote desde el
panel si algo no va, y el **dueño** puede despublicar/republicar el suyo desde
"Mis lotes". Un lote con `publico = false` desaparece del catálogo y de la ficha
pública. (Para distinguir lotes del mercado de los "leads" del form viejo, los del
mercado tienen `user_id` no nulo; el catálogo filtra por eso.)

### RLS del catálogo (mínima y explicada)
El problema: un usuario de beta necesita **leer lotes publicados de otros**, pero
la tabla `lotes` tiene columnas internas/legacy sensibles (márgenes, notas
internas, contacto del form viejo, `user_id`). Una política `select` amplia sobre
la tabla expondría todas esas columnas.

Solución (mínimo privilegio, sin abrir la tabla): **no** se agregó ningún `select`
amplio sobre `lotes`. El catálogo se sirve por la función **`catalogo()`
(SECURITY DEFINER)** que devuelve **solo columnas comerciales** + empresa y
provincia del dueño. Nunca expone `user_id`, ni teléfono, ni columnas internas.
Para `lotes`, las políticas nuevas para el rol `authenticated` son **solo del
dueño**:
- `lotes beta insert` → `with check (user_id = auth.uid())` (solo crea lotes suyos).
- `lotes own select` → `using (user_id = auth.uid())` (solo lee los suyos, para "Mis lotes").
- `lotes own update` / `lotes own delete` → solo los suyos (editar/despublicar/borrar).

Las RLS existentes (`anon insert`, `staff select/update`) **no se tocaron**.

> Nota sobre el `anon insert` heredado: sigue permitiendo inserts anónimos (del
> form viejo, ahora redirigido), pero esos lotes tienen `user_id` nulo → **no
> aparecen en el catálogo** (que exige `user_id` no nulo + join a `usuarios`).
> Para "falsificar" un lote a nombre de otra empresa habría que conocer el `uuid`
> de auth de la víctima, que es secreto y no se expone en ninguna parte → riesgo
> despreciable. Por eso no fue necesario modificar esa política.

### Contacto sin exponer números en masa
El listado del catálogo **no** incluye los WhatsApp (no son scrapeables del HTML).
El botón "Consultar por WhatsApp" llama a **`contacto_lote(lote_id)`** al hacer
clic, que devuelve el número del dueño solo para ese lote, arma el mensaje
pre-cargado + el link a la ficha pública `/lote/[id]`, y abre `wa.me`.

## Qué se construyó (rutas, todas bajo `/cuenta`, protegidas)

- **`/cuenta`** — saludo + aviso de "completá tu empresa" si falta + accesos.
- **`/cuenta/empresa`** — perfil de empresa (razón social, fantasía, CUIT, RUCA,
  habilitación, provincia/localidad, **WhatsApp**). Guarda en la fila propia de
  `usuarios`. **Sin documentos** (eso es verificación futura).
- **`/cuenta/publicar`** — carga de lote: BÁSICOS visibles (título, corte/artículo
  con opción "otro", descripción, fotos hasta 10) + ESPECIFICACIONES colapsables
  ("Mostrar/Ocultar especificaciones"). Publica directo. Sirve también para
  **editar** un lote propio (`/cuenta/publicar?id=…`).
- **`/cuenta/mercado`** — catálogo de TODOS los lotes publicados (función
  `catalogo`), con filtros (corte, provincia, estado) y buscador por texto, fotos
  firmadas, y botón de WhatsApp por lote.
- **`/cuenta/mis-lotes`** — los lotes propios, con Editar / Despublicar-Publicar /
  Eliminar / Ver ficha.
- **`/publicar`** (viejo) → **redirige** a `/cuenta/publicar`.

## CHECKLIST DE SEGURIDAD (cómo está resuelto y cómo probar con 2 cuentas)

1. **Un usuario solo edita/despublica/borra SUS lotes.**
   - Cómo: `lotes own update/delete` → `using (user_id = auth.uid())`. Editar un
     lote ajeno afecta 0 filas; `/cuenta/publicar?id=<ajeno>` no lo encuentra
     (own select).
   - Probar: con la cuenta B, intentá `/cuenta/publicar?id=<id de un lote de A>` →
     "no encontrado". B no ve el lote de A en "Mis lotes".

2. **El catálogo no expone `user_id` ni datos sensibles del dueño.**
   - Cómo: `catalogo()` devuelve solo columnas comerciales + empresa/provincia.
     Mirá el JSON de la respuesta: no hay `user_id`, ni `whatsapp`, ni columnas
     internas.

3. **Un usuario no edita el perfil de empresa de otro.**
   - Cómo: RLS de `usuarios` (de la tanda 3): `update using (id = auth.uid())`.
     `guardarEmpresa` actualiza `where id = auth.uid()`.

4. **El WhatsApp se arma al número correcto del dueño, sin exponerlo en masa.**
   - Cómo: el número no está en el listado; se pide por `contacto_lote(lote_id)`
     al hacer clic, que lo trae del perfil del dueño de ese lote.

5. **anon (sin login) no lee el catálogo interno.**
   - Cómo: `catalogo()` y `contacto_lote()` están `grant execute ... to
     authenticated` (no `anon`). Lo único público sigue siendo la ficha
     `/lote/[id]` y solo si `publico = true` (sin cambios).

## Cómo probar el flujo (después de la migración)

1. Logueate como usuario de beta A → `/cuenta/empresa`, completá (incluí WhatsApp) → guardar.
2. `/cuenta/publicar` → cargá un lote con foto → Publicar → aparece en "Mis lotes".
3. Con una **segunda** cuenta B (otra invitación), entrá a `/cuenta/mercado` → ves
   el lote de A, filtrás, y "Consultar por WhatsApp" abre el chat al número de A
   con el mensaje + link a `/lote/[id]`.
4. Verificá los puntos de seguridad de arriba con A y B.

## Criterios de aceptación
- ✅ Usuario completa empresa, publica lote (básicos + specs colapsables), lo ve en Mis lotes.
- ✅ Otro usuario lo ve en el catálogo, filtra y abre WhatsApp con mensaje pre-cargado.
- ✅ Separación de permisos por RLS del dueño (verificable con 2 cuentas).
- ✅ `/publicar` viejo fuera del flujo (redirige).
- ✅ Migración + decisiones (estado de publicación, RLS del catálogo) + checklist (este archivo).
