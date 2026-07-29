# TANDA · Arreglos de landing (A) + Alta de beta con aprobación manual (B)

## ⚠️ Migración a correr (vos, a mano) — 1 sola

Hay **una** migración nueva: la tabla `solicitudes_beta`. Sin esto, el formulario
`/sumate` carga pero **no guarda** (y `/panel/solicitudes` aparece vacío/con error).

Supabase → **SQL Editor** → **New query** → pegar TODO → **Run**
(idempotente, no borra ni modifica datos):

```sql
create table if not exists public.solicitudes_beta (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre_contacto text, empresa text, cuit text,
  rol text,        -- 'vende' | 'compra' | 'ambas'
  contacto text, notas text,
  estado text not null default 'pendiente'  -- 'pendiente' | 'aprobada' | 'rechazada'
);
alter table public.solicitudes_beta enable row level security;

drop policy if exists "solicitudes anon insert" on public.solicitudes_beta;
create policy "solicitudes anon insert" on public.solicitudes_beta
  for insert to anon with check (true);
drop policy if exists "solicitudes staff select" on public.solicitudes_beta;
create policy "solicitudes staff select" on public.solicitudes_beta
  for select to authenticated using (public.is_staff());
drop policy if exists "solicitudes staff update" on public.solicitudes_beta;
create policy "solicitudes staff update" on public.solicitudes_beta
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
```

(Mismo bloque versionado en `supabase/migrations/0006_solicitudes_beta.sql` y
reflejado en `supabase/schema.sql`.) Requiere que `is_staff()` ya exista (migración
del panel, ya aplicada).

---

## BLOQUE A — Arreglos de landing (hechos)

1. **Consistencia de marca "MBEEF"**: verificado con grep que el **texto visible
   ya usa "MBEEF"** en toda la landing (hero, sello, respaldo, footer, header,
   metadata). Los únicos "Mbeef/mbeef" que aparecen son **identificadores de
   código** (`mbeefUrl`, componente `RespaldoMbeef`) y el **dominio**
   `trading-mbeef` (que la consigna pide no tocar). → **Sin cambios de copy
   necesarios**; quedó consistente.

2. **Contador de años + zona header/marca**:
   - El contador ahora **renderiza "30+" desde el inicio** (antes podía quedar
     pegado en "0+"). Se animа desde 0 solo al entrar en viewport; si no, muestra
     el valor final. (`components/motion.tsx`).
   - Header un poco **más opaco** (`bg-carbon/95`) para que las secciones claras
     (como el TrustBar) no "sangren" por debajo del header fijo translúcido al
     scrollear, que era la causa más probable del solapamiento reportado.
   - Nota: no pude reproducir un solapamiento *estructural* entre el sello de marca
     y el TrustBar (están en flujo normal con separación clara). El headless no
     deja capturar bajo el hero (`min-h-svh` + animaciones `whileInView`).
     **Verificá en tu navegador/celular**; si seguís viendo pisado, mandá captura
     y lo ajusto.

3. **CTAs "Sumate" → `/sumate`** (antes `/publicar`): hero, header, menú móvil,
   requisitos y CTA final.

4. **Requisitos**: "Para publicar necesitás:" → "**Para sumarte necesitás:**".

> Nota: `/publicar` (el formulario de carga de lote) sigue existiendo y accesible
> por URL directa; solo dejó de ser el destino de los botones "Sumate".

## BLOQUE B — Alta de beta con aprobación manual (hecho)

- **`/sumate`** (pública, sin login): formulario corto coherente con la landing.
  Campos: nombre y apellido, empresa, CUIT (valida formato + dígito verificador,
  sin pedir documentos), ¿Qué hacés? (Vendo/Compro/Ambas), WhatsApp o email,
  comentario opcional. Al enviar crea la fila en `solicitudes_beta` (estado
  `pendiente`) y muestra confirmación, **sin login ni promesa de plazo**.
- **`/panel/solicitudes`** (solo staff): lista con empresa, nombre, CUIT, rol,
  contacto, fecha y estado; **filtro** por estado; **contador de pendientes**;
  botones **Aprobar / Rechazar** por fila; y **botón de WhatsApp** al contacto
  (si es número) para el aviso manual. "Solicitudes" agregado a la nav del panel.
- **Seguridad**: anon **solo INSERT** en `solicitudes_beta` (mismo patrón que
  `lotes`); lectura y cambio de estado **solo staff** (`is_staff()`). No se envían
  mails (el aviso es manual por WhatsApp/teléfono).

## Cómo probar (después de correr la migración)

1. **Alta pública**: abrí `/sumate`, completá (probá un CUIT inválido → debe
   marcar error; uno válido pasa), enviá → ves la confirmación.
2. **Seguridad anon**: en el SQL Editor, `select * from solicitudes_beta;` como
   verificación de que la fila se creó. (Desde la app, anon no puede leerla.)
3. **Panel**: entrá a `/panel/solicitudes` (logueada como staff). Deberías ver la
   solicitud en "Pendiente", con el contador en 1. Probá **Aprobar** y
   **Rechazar** (cambian el estado) y el filtro por estado. Si el contacto es un
   número, aparece **Avisar por WhatsApp**.

## Criterios de aceptación — estado
- ✅ Grafía "MBEEF" consistente (ya lo estaba; verificado con grep).
- ✅ Contador en "30+" (no "0+"). Header más opaco para el bleed; overlap a
  confirmar en navegador real.
- ✅ Todos los "Sumate" → `/sumate`.
- ✅ `/sumate` crea solicitudes `pendiente`, valida CUIT, sin login ni documentos.
- ✅ anon NO puede leer `solicitudes_beta` (RLS solo INSERT para anon).
- ✅ `/panel/solicitudes` lista, filtra, aprueba/rechaza, con WhatsApp al contacto.
- ✅ Esta TANDA.md con migración y pasos de prueba.

---

# TANDA · Búsquedas (RFQ) — el mercado invertido (0016)

Sección nueva **separada de "Mercado"**: los compradores publican lo que buscan
y los vendedores responden con **ofertas comparables**. Todo requiere login
(`/cuenta/busquedas`). No toca el catálogo, el login, el panel ni las RLS previas.

## ⚠️ Migración a correr (vos, a mano) — 1 sola

Supabase → **SQL Editor** → **New query** → pegar el contenido de
`supabase/migrations/0016_busquedas.sql` → **Run**.
Es **aditiva** (no borra datos): crea las tablas `busquedas` y `ofertas`, sus RLS
y las funciones (`busquedas_abiertas`, `busqueda_ver`, `crear_oferta`,
`ofertas_de_busqueda`, `responder_oferta`, `contacto_oferta`, `mis_busquedas`,
`mis_ofertas`). Todas las funciones se otorgan **solo a `authenticated`** (no anon).

## Modelo de seguridad (aislamiento de ofertas)

- `busquedas` y `ofertas` tienen RLS **own-only** (por acceso directo cada quien ve
  solo sus filas). Las abiertas de otros y las ofertas del comprador se sirven por
  **funciones SECURITY DEFINER** que chequean `auth.uid()` explícitamente.
- Un **vendedor** por acceso directo (o vía `ofertas_de_busqueda`) ve **solo sus
  propias** ofertas → nunca las de la competencia.
- El **comprador dueño** de la búsqueda ve **todas** las ofertas (vía función).
- `contacto_oferta` devuelve el WhatsApp del vendedor **solo** al comprador dueño y
  **solo** si la oferta está `aceptada`. La lista no expone contacto crudo (solo
  empresa/zona del comprador).

## ✅ Checklist de seguridad (verificar con cuentas de prueba)

- [ ] Vendedor A y Vendedor B ofertan la MISMA búsqueda. A **no** ve la oferta de B
      ni por la UI ni consultando `ofertas` directo (RLS own-only) ni por
      `ofertas_de_busqueda` (A recibe solo la suya).
- [ ] El comprador dueño ve **todas** las ofertas de su búsqueda y puede
      aceptar/rechazar (`responder_oferta`).
- [ ] Un usuario solo edita/cierra **sus** búsquedas (RLS own update) y solo ve/crea
      **sus** ofertas (`crear_oferta` inserta con `user_id = auth.uid()`).
- [ ] La lista `busquedas_abiertas` **no** trae `user_id` crudo ni contacto (solo
      empresa + zona). El contacto se habilita con login y al **aceptar**.
- [ ] anon (sin login) **no** ejecuta ninguna función nueva (revoke a anon) ni entra
      a `/cuenta/busquedas` (redirige a `/login`).
- [ ] Un vendedor no puede ofertar una búsqueda **cerrada** ni la **propia**
      (`crear_oferta` lo rechaza).

---

# TANDA · Cambio de propuesta de valor — servicio de colocación (rama servicio-colocacion)

**Rama:** `servicio-colocacion` (main queda intacto = producción). Sin migraciones.
No se toca app/panel/login/RLS: solo copy y navegación pública de la landing.

## Modelo nuevo
DeCarnes deja de ser autoservicio. MBEEF trabaja con **frigoríficos seleccionados**:
recibe su stock, lo **publica y lo coloca** en su red de compradores. El comprador
navega el catálogo público y consulta (sin cambios). **Comisión solo cuando se
vende** (sin publicar el %); el comprador **paga directo** al vendedor; el flete se
coordina por operación. El formulario `/cuenta/publicar` queda para uso del staff.

## Cambios en la landing
1. **Hero + metadata:** H1 "Lotes de frigoríficos seleccionados, en un solo lugar."
   Subtítulo del modelo nuevo. CTAs: "Ver lotes" (→/mercado) y "Quiero vender mi
   stock" (→WhatsApp pre-cargado). title/description/og/twitter actualizados.
2. **Cómo funciona:** dos caminos, "Si comprás" (3 pasos) y "Si vendés" (3 pasos).
3. **Por qué DeCarnes:** "Más visibilidad" reescrita; "Publicar es gratis" →
   "Frigoríficos seleccionados".
4. **Servicios:** sección eliminada (componente + render + link nav desktop/mobile).
5. **Comparativa:** filas Alcance / Colocación / Selección / Respaldo / Costo.
6. **Requisitos:** intro "Trabajamos con frigoríficos habilitados…"; cierre
   "¿Cumplís? Escribinos." → WhatsApp. Se mantiene la lista y la línea del comprador.
7. **FAQ:** 7 preguntas reescritas al modelo nuevo.
8. **CTA final:** "Lotes seleccionados, todos los días." + Ver lotes / Quiero vender.
9. **Flujo:** header y menú móvil: "Sumate" → botón "Quiero vender" (WhatsApp).
   Se mantienen "Ingresar" y "Ver lotes publicados". `/mercado` público: el aviso a
   vendedores ahora va por WhatsApp (no "sumate a publicar"). `/sumate` sigue
   existiendo como camino del comprador (no se toca).

## Verificado
- Cero menciones a "publicar es gratis", "publicá tus cortes", vendedor publica
  solo, garantía de cobro o logística incluida (barrido en components/ y app/).
- Comisión comunicada como "solo cuando se vende", sin porcentaje.
- typecheck + build OK. main sin cambios.
