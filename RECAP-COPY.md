# RECAP · Reestructuración de copy de la landing (modelo marketplace)

Cambio de propuesta de valor: de "MBEEF te compra/cotiza el lote y garantiza el
cobro" → **marketplace de carne powered by MBEEF** (publicar es gratis, MBEEF
opera como un actor más, sin garantía de cobro ni cotización en 24hs).

Alcance: **solo la landing y su copy/estructura**. NO se tocó el formulario
(`/publicar`, `/publicar/legajo`), el panel interno ni la conexión a Supabase.

## Cambios sección por sección

### Metadata (`app/layout.tsx`)
- `title` / `og:title`: "DeCarnes | El mercado de la carne, en un solo lugar".
- `description` / `og:description`: nuevo texto marketplace ("Publicá tus cortes
  y encontrá los que buscás… Publicar es gratis. Powered by MBEEF.").
- **Fix OG/Twitter**: `metadataBase` ahora hace default a
  `https://trading-mbeef.vercel.app` (antes `http://localhost:3000`), así las
  `og:image` y `twitter:image` quedan **absolutas de producción**. Se puede
  sobreescribir con `NEXT_PUBLIC_SITE_URL`. Se agregó bloque `twitter`
  (summary_large_image).

### Hero (`components/Hero.tsx`)
- H1 L1 (hueso): "El mercado de la carne, en un solo lugar."
- H1 L2 (rojo-claro): "Publicá tus cortes. Encontrá los que buscás."
- Subtítulo: "DeCarnes conecta la oferta y la demanda de carne de todo el país.
  Publicar es gratis. Powered by MBEEF, operador del mercado desde 1944."
- CTA primario: "Sumate" (→ `/publicar`). Secundario: "Hablar con un operador".
- Sello: "Powered by MBEEF · En el mercado de la carne desde 1944".
- Ticker de cortes: **sin cambios**. Se borraron los comentarios A/B del modelo viejo.

### Header / MobileMenu (`components/Header.tsx`, `components/MobileMenu.tsx`)
- Subtítulo de marca: "La mesa de compras de MBEEF" → "El mercado de la carne".
- Nav: "Ventajas" → "Por qué"; se agregó "Servicios" (#servicios).
- CTA "Publicar un lote" → "Sumate" (coherencia con el resto).

### Barra de confianza (`components/TrustBar.tsx`)
- Contador en **+30** con texto "años de MBEEF en el mercado de la carne".
- "Operador mayorista de carne **vacuna**…" → "Operador mayorista de carne…".

### Cómo funciona (`components/HowItWorks.tsx`)
1. "Publicás tus cortes" — visible para compradores de todo el país.
2. "Conectás con el mercado" — compradores te contactan.
3. "Cerrás la operación" — "Acordás directo con la otra parte." (**sin** coletilla
   de MBEEF, sin cobranza garantizada).

### Por qué DeCarnes (`components/Advantages.tsx`, antes "La solución integral")
- Título: "Por qué DeCarnes" (se quitó el subtítulo viejo).
- 4 tarjetas: Más visibilidad / Todo el país en un lugar / Respaldo de MBEEF /
  Publicar es gratis. (Se eliminaron "Vendemos por vos", "Cobro sin riesgo",
  "Logística resuelta", "Precio con fundamento".)

### NUEVA · Servicios para operar mejor (`components/Servicios.tsx`)
- Sección nueva (id `#servicios`), insertada entre "Por qué DeCarnes" y la
  comparativa. Visualmente separada y con tag **"Opcional · bajo consulta"**.
- 3 ítems, todos bajo consulta y sin precios: Asesoramiento comercial /
  Colocación a comisión / Coordinación logística.
- CTA suave "Consultanos" → WhatsApp + aclaración de que es aparte del mercado
  gratuito.

### Comparativa (`components/Comparison.tsx`)
- Título: "El mercado hoy vs. con DeCarnes". Columnas: "El mercado hoy" / "Con
  DeCarnes" (label mobile "Hoy:").
- Filas nuevas (se eliminaron cobro garantizado y logística coordinada):
  Alcance / Precios / Visibilidad / Respaldo (Powered by MBEEF, +30 años) /
  Costo (— vs "Publicar es gratis").

### Para quién es (`components/Requirements.tsx`)
- Lista de requisitos: **sin cambios** (habilitación, RUCA, CUIT, trazabilidad).
- Cierre: "¿Cumplís? Tu lote puede estar ofertado mañana." → "¿Cumplís? Sumate al
  mercado." CTA "Publicar un lote" → "Sumate".

### Respaldo MBEEF (`components/RespaldoMbeef.tsx`)
- Frase ancla: "DeCarnes es el mercado de carne impulsado por MBEEF, abierto a
  todos."
- Párrafo: se quitó "vacuna" como limitante. `[HISTORIA MBEEF]` se mantiene.
- Alt de la foto: "Hacienda **vacuna** en el campo…" → "Hacienda en el campo…".

### FAQ (`components/Faq.tsx`)
- Reescrita entera (5 preguntas del modelo marketplace): ¿Qué es DeCarnes? /
  ¿Tiene costo? / ¿Quién puede publicar? / ¿Qué rol juega MBEEF? / ¿Cómo contacto
  a la otra parte? Se eliminaron "¿Cómo me garantizan el cobro?" y similares.

### CTA final (`components/FinalCta.tsx`)
- Título: "Sumate al mercado de la carne." Texto: "Publicá tus cortes y conectá
  con compradores de todo el país. Powered by MBEEF." CTA "Sumate".

### Footer (`components/Footer.tsx`)
- "La mesa de compras de MBEEF, abierta al mercado." → "El mercado de la carne,
  impulsado por MBEEF."
- "Operaciones respaldadas por MBEEF · …" → "Powered by MBEEF · En el mercado de
  la carne desde 1944".

## Criterios de aceptación
- ✅ Cero "garantía de cobro / cotización en 24hs / te compramos en firme /
  vendemos por vos" en la **landing** (verificado con grep sobre los componentes
  de la landing).
- ✅ Cero "vacuna" como limitante en la landing.
- ✅ Paso 3 del "cómo funciona" sin coletillas de MBEEF.
- ✅ Sección "Servicios para operar mejor" separada y marcada opcional/bajo consulta.
- ✅ Contador en "+30 años".
- ✅ OG/Twitter con URL absoluta de producción; `metadataBase` seteado.
- ✅ CTA "Sumate" en hero, requisitos y cierre, todos → `/publicar`.

## ⚠️ Pendiente fuera de alcance (NO tocado por las reglas de la tarea)
El **formulario** (`components/PublicarWizard.tsx`, pantalla de confirmación)
todavía dice: *"Un operador de DeCarnes te contacta en menos de 24 horas hábiles
con una cotización."* — es copy del modelo viejo, pero el formulario estaba
explícitamente fuera de alcance. **Acción sugerida (otra tarea):** actualizar el
copy del wizard y la confirmación al modelo marketplace (p. ej. "Tu publicación
queda visible en el mercado; coordinás el contacto desde ahí"). También revisar
textos internos del wizard que mencionan "precio pretendido / cotización".
