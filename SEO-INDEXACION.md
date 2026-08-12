# Indexar decarnesonline.com en Google

## Estado al 11/08/2026 (verificado en Search Console)

| Página | Estado |
|---|---|
| `/` (home) | **Indexada** ✅ |
| `/mercado` | Descubierta, sin indexar → indexación solicitada |
| `/enterate` | Descubierta, sin indexar → indexación solicitada |
| Fichas de lote | En el sitemap, esperando rastreo |

> **Corrección:** una primera revisión con `site:decarnesonline.com` sugirió que
> el sitio no estaba indexado. Era un falso negativo de esa herramienta de
> búsqueda. Search Console confirma que la home ya estaba en Google.

**Ya hecho** (sesión del 11/08):

- ✅ Propiedad de tipo Dominio creada y **verificada** en Search Console
  (cuenta `lucarita2006@gmail.com`, método TXT en DNS)
- ✅ `NEXT_PUBLIC_SITE_URL` corregida a `https://www.decarnesonline.com` + redeploy
- ✅ Sitemap enviado — estado **Correcto**, 13 páginas descubiertas
- ✅ Indexación solicitada para `/mercado` y `/enterate`

**Pendiente:** pushear los cambios de código (canonicals + JSON-LD), y los pasos
de Google Business Profile y enlaces entrantes (Parte 2, pasos 4 y 5).

---

Este documento tiene dos partes: **lo que ya arreglé en el código** y **lo que
falta hacer** (con los pasos exactos).

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

### ~~Paso 0 · Corregir la variable en Vercel~~ ✅ HECHO

`NEXT_PUBLIC_SITE_URL` = `https://www.decarnesonline.com` (Production and
Preview) + redeploy. Confirmado: el sitemap ya sirve URLs con www.

### ~~Paso 1 · Verificar el dominio en Search Console~~ ✅ HECHO

Propiedad de tipo **Dominio** (`decarnesonline.com`), verificada por TXT.

**Dónde está el DNS, para la próxima:** el registrador es **eNom**, pero los
nameservers apuntan a Vercel (`ns1.vercel-dns.com` / `ns2.vercel-dns.com`), así
que los registros DNS se editan en **Vercel → Domains → decarnesonline.com →
DNS Records**, no en eNom. En eNom los Host Records están deshabilitados
justamente por eso. No cambies los nameservers ahí: tirarías el sitio abajo.

El TXT quedó cargado con el comentario "Verificacion Google Search Console".
**No lo borres** — si desaparece, Search Console pierde la verificación.

### ~~Paso 2 · Enviar el sitemap~~ ✅ HECHO

`https://www.decarnesonline.com/sitemap.xml` → estado **Correcto**, 13 páginas
descubiertas (4 fijas + 9 lotes).

### ~~Paso 3 · Pedir indexación de las páginas clave~~ ✅ HECHO

`/mercado` y `/enterate` quedaron en la cola de rastreo prioritario. La home ya
estaba indexada, así que no consumió cuota.

Google limita a unas 10-12 solicitudes por día. Las fichas de lote las va a
encontrar sola vía el sitemap y el `ItemList` de `/mercado`.

**Tiempos realistas:** las páginas solicitadas suelen entrar en 2-7 días. Que
aparezcan ≠ que rankeen.

### Paso 3 bis · Pushear el código

Los cambios de canonicals y JSON-LD siguen locales. Antes de subirlos:

```bash
npm run build      # verificar que compila
git add -A && git commit -m "SEO: canonicals, JSON-LD y dominio canonico unificado"
git push
```

Vercel deploya solo al detectar el push.

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
