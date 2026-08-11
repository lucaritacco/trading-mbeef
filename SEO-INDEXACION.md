# Indexar decarnesonline.com en Google

Estado al 11/08/2026: el sitio **no aparece en Google todavía**. No hay nada roto —
simplemente nunca se le avisó a Google que existe, y un dominio nuevo sin enlaces
externos puede tardar semanas en ser descubierto solo.

Este documento tiene dos partes: **lo que ya arreglé en el código** y **lo que
tenés que hacer vos** (con los pasos exactos).

---

## Parte 1 — Lo que ya está hecho en el código

### 1. Unificado el dominio canónico (era el problema más serio)

`decarnesonline.com` redirige con 301 a `www.decarnesonline.com`, pero el sitemap,
el `robots.txt`, los canonicals y las imágenes de Open Graph usaban la versión
**sin www**. Resultado: Google recibía señales contradictorias sobre cuál es la
dirección real del sitio, y cada URL del sitemap le devolvía un redirect.

Ahora existe `lib/seo.ts` como única fuente de verdad: de ahí salen `metadataBase`,
canonicals, sitemap, robots y JSON-LD. El default es `https://www.decarnesonline.com`.

> **Acción requerida en Vercel** (ver Parte 2, paso 0). La variable
> `NEXT_PUBLIC_SITE_URL` hoy está seteada en `https://decarnesonline.com` y pisa
> el default del código. Hay que cambiarla o borrarla.

### 2. Canonicals por página

Cada página indexable ahora declara su URL canónica. El caso importante es
`/mercado`: los filtros generan URLs como `?corte=asado&provincia=...` que
producen decenas de variantes del mismo contenido. Ahora todas apuntan a
`/mercado` a secas, así Google no las trata como duplicados.

### 3. Datos estructurados (JSON-LD)

| Tipo | Dónde | Para qué |
|---|---|---|
| `Organization` | Todo el sitio | Vincula DeCarnes con MBEEF, dirección y teléfono |
| `WebSite` | Todo el sitio | Nombre del sitio + caja de búsqueda en la SERP |
| `FAQPage` | Home | Las 6 preguntas frecuentes como resultado enriquecido |
| `BreadcrumbList` | `/mercado`, `/lote/[id]` | Jerarquía en vez de URL cruda en el resultado |
| `ItemList` | `/mercado` | Ayuda a Google a descubrir las fichas de lote más rápido |
| `Product` + `Offer` | `/lote/[id]` | Precio y disponibilidad en el resultado de búsqueda |

Las preguntas frecuentes se movieron a `lib/faq.ts` para que el schema y el
acordeón visible usen el mismo texto — si difieren, Google descarta el rich result.

### 4. Sitemap completo

Antes solo listaba `/` y `/mercado`. Ahora incluye `/enterate` y `/sumate`, y
todas las entradas llevan `lastModified`.

### 5. Detalles menores

- `lang="es"` → `lang="es-AR"` (relevante para búsquedas locales)
- `max-image-preview: large` y `max-snippet: -1`: permite miniaturas grandes y
  fragmentos largos en la SERP
- `openGraph.siteName` y `url` (mejora las previews de WhatsApp)
- Emails y panel ya no caen al fallback `trading-mbeef.vercel.app`

---

## Parte 2 — Lo que tenés que hacer vos

### Paso 0 · Corregir la variable en Vercel (antes de deployar)

1. Vercel → proyecto `trading-mbeef` → **Settings → Environment Variables**
2. Buscá `NEXT_PUBLIC_SITE_URL`
3. Cambiá el valor a `https://www.decarnesonline.com` en **Production**
4. Redeploy

Alternativa: si preferís que el dominio principal sea **sin** www, andá a
**Settings → Domains** y marcá `decarnesonline.com` como primario (que
`www` redirija hacia él). En ese caso la variable queda como está y hay que
cambiar el `FALLBACK` en `lib/seo.ts`. Cualquiera de las dos sirve — lo que no
puede pasar es que no coincidan.

### Paso 1 · Verificar el dominio en Google Search Console

1. Entrá a [search.google.com/search-console](https://search.google.com/search-console)
   con la cuenta de Google de MBEEF (no una personal — después es un dolor migrarla)
2. **Agregar propiedad** → elegí **Dominio** (la columna de la izquierda), no
   "Prefijo de URL". La propiedad de dominio cubre www, sin-www, http y https de
   una sola vez, que es justo lo que necesitás acá
3. Escribí `decarnesonline.com` (sin `https://`, sin `www`)
4. Google te da un registro **TXT** tipo `google-site-verification=abc123...`
5. Agregalo en el panel de tu proveedor de DNS:
   - **Tipo:** TXT
   - **Nombre/Host:** `@` (o dejalo vacío, según el proveedor)
   - **Valor:** el string completo que te dio Google
6. Guardá y volvé a Search Console → **Verificar**. Suele tomar entre 5 minutos
   y 1 hora. Si falla, esperá y reintentá — no borres el registro.

> ¿No tenés acceso al DNS? Verificá con **Prefijo de URL** en su lugar y usá el
> método de archivo HTML o la meta tag (esa te la agrego yo al código en 2 minutos).
> Perdés la cobertura de todas las variantes, pero funciona.

### Paso 2 · Enviar el sitemap

Search Console → **Sitemaps** (menú izquierdo) → escribí `sitemap.xml` → **Enviar**.

Debería pasar a estado "Correcto" y mostrar la cantidad de URLs detectadas
(hoy: 4 páginas fijas + 1 por cada lote publicado).

### Paso 3 · Pedir indexación manual de las páginas clave

Esto es lo que acelera todo. En la barra de arriba de Search Console
("Inspeccionar cualquier URL"), pegá cada una de estas y hacé clic en
**Solicitar indexación**:

```
https://www.decarnesonline.com/
https://www.decarnesonline.com/mercado
https://www.decarnesonline.com/enterate
```

Hacé una por vez y esperá a que termine el chequeo (~30 seg cada una). Google
limita a unas 10-12 solicitudes por día, así que priorizá esas tres. Las fichas
de lote las va a encontrar sola vía el sitemap y el `ItemList` de `/mercado`.

**Tiempos realistas:** la home suele aparecer en 2-7 días. El resto del sitio,
2-4 semanas. Que aparezca ≠ que rankee.

### Paso 4 · Google Business Profile (esto rinde más que el SEO puro)

Para un mayorista en Bahía Blanca, la ficha de Google Maps te trae más consultas
que rankear por "comprar carne por mayor". Es gratis y toma 15 minutos:

1. [business.google.com](https://business.google.com) → crear perfil
2. Nombre: **MBEEF** (o "DeCarnes by MBEEF" si es la marca que querés empujar)
3. Categoría principal: *Proveedor de carne* o *Distribuidor mayorista*
4. Dirección: Thompson 1226, Bahía Blanca
5. Teléfono: +54 9 291 414-5189 · Sitio web: `https://www.decarnesonline.com`
6. Google manda una postal con código de verificación (5-14 días)

Una vez verificado, subí 5-10 fotos reales de producto. Las fichas con fotos
reciben bastantes más clics que las que no tienen.

### Paso 5 · Conseguir los primeros enlaces

Un dominio nuevo sin ningún enlace entrante tarda mucho en generar confianza.
Los más fáciles y legítimos:

- **Desde `mbeef.shop`**: poné un link visible a DeCarnes. Es el más valioso
  porque es un dominio relacionado y con historia. (Hoy el link va en una sola
  dirección: DeCarnes → MBEEF.)
- **Instagram / Facebook / LinkedIn** de MBEEF: el sitio en la bio
- **Cámaras y directorios del sector**: cámara de comercio de Bahía Blanca,
  directorios de la industria frigorífica argentina
- **WhatsApp Business**: sitio web en el perfil

---

## Parte 3 — Qué revisar dentro de 2 semanas

En Search Console:

- **Páginas** → ¿cuántas indexadas vs. no indexadas? Si aparecen muchas en
  "Descubierta: actualmente sin indexar", el sitio le parece de baja prioridad a
  Google → hacen falta más enlaces y más contenido.
- **Rendimiento** → primeras impresiones y qué búsquedas las traen. Esto te dice
  con qué te está asociando Google, que muchas veces no es lo que esperabas.
- **Mejoras / Resultados enriquecidos** → confirmar que detecta FAQ, Breadcrumbs
  y Product sin errores.

Mientras tanto, podés validar el schema en
[search.google.com/test/rich-results](https://search.google.com/test/rich-results)
apenas esté deployado.

---

## Nota sobre el repo

`git status` muestra ~15 archivos modificados que **yo no toqué**
(`Hero.tsx`, `schema.sql`, `TANDA.md`, etc.). Son cambios de fin de línea
(CRLF ↔ LF) que ya estaban en el working tree, probablemente por la sincronización
de OneDrive. No son cambios reales de contenido. Si te molestan en el diff:

```bash
git config core.autocrlf true
```

Los archivos que sí modifiqué para esto son:

```
lib/seo.ts            (nuevo)
lib/faq.ts            (nuevo)
app/layout.tsx
app/page.tsx
app/sitemap.ts
app/robots.ts
app/mercado/page.tsx
app/lote/[id]/page.tsx
app/enterate/page.tsx
app/sumate/page.tsx
components/Faq.tsx
lib/email.ts
app/panel/(panel)/solicitudes/page.tsx
```

Verificado con `tsc --noEmit` y `eslint` (ambos limpios). **No pude correr
`next build`** — el sandbox no tiene acceso a npm para bajar el binario de SWC
para Linux. Corré `npm run build` local antes de deployar.
