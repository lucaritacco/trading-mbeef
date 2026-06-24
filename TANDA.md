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
