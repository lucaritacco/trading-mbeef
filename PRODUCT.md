# DeCarnes — PRODUCT.md

register: brand

## Qué es

DeCarnes es la plataforma de trading de carne de MBEEF, una empresa argentina comercializadora/operadora mayorista de carne vacuna, con más de 30 años de trayectoria y raíces en el rubro desde 1994. MBEEF NO es un frigorífico, NO tiene planta propia y NO produce ni faena carne: compra, coloca y mueve carne entre frigoríficos, distribuidores y puntos de venta. No es un marketplace abierto: es una mesa de compra y colocación de lotes. El proveedor publica un lote, MBEEF responde en menos de 24 horas hábiles con una oferta en firme (compra directa o colocación a comisión) y coordina la logística refrigerada. (La garantía de cobro está pendiente de definición comercial: ver TODOs en el código.)

## Usuarios

Empresario de frigorífico/proveedor de carne, 40-65 años, argentino. Entra desde el celular. Desconfiado de promesas de internet; sensible a señales de seriedad, trayectoria y respaldo. Su dolor no es producir: es vender (mercado sobreofertado).

## Voz y tono

Español rioplatense, voseo, directo y sobrio. Tres palabras de marca: **pesado, franco, establecido**. La sensación buscada: "esta gente mueve toneladas en serio". Anti-referencia: estética startup juguetona, "hizo un curso de no-code", SaaS genérico.

## Arquitectura de marcas

- **DeCarnes**: el mercado (wordmark tipográfico serif "DECARNES").
- **MBEEF**: el respaldo. Sello "Operaciones respaldadas por MBEEF · En el mercado de la carne desde 1994" en sub-hero, header y footer.

## Sistema visual (del manual de marca MBEEF)

- Paleta: carbón #1D1D1B, bordó #B30E2A, rojo #D73534, salmón #E07E63, taupe #C3AEA7, verde #3C5A34, blanco hueso #F0EFE9. Ritmo de secciones alternando carbón / hueso, con CTA final drenched en bordó (como la página "GRACIAS" del manual).
- Tipografía corporativa: ITC Garamond Std Light Condensed + Henderson Sans Semibold (de pago). Sustitutos web: **EB Garamond** (títulos, serif) + **Archivo** (cuerpo/UI, grotesca). Labels en caps con tracking ancho, estilo etiqueta de producto.
- Fotografía real de producto y de la operación, tratamiento oscuro. Nada de stock genérico de oficinas ni ilustraciones.

## Reglas duras

- Nunca inventar métricas, testimonios ni datos. Única métrica aprobada: 30+ años de trayectoria; raíces en el rubro desde 1994.
- Cero texto en inglés de cara al usuario. Cero lorem ipsum.
- Simplicidad, seriedad y velocidad de carga antes que efectos. Animaciones sutiles al scroll.
- v1 sin: cuentas de comprador, chat, pujas, pagos online, registro de compradores.

## Referencias

- Modelo de negocio: decampoacampo.com (mercado ganadero respaldado por consignataria).
- Spec completa de producto (formulario wizard, panel interno, ficha de lote, fase 2): ver prompt de construcción DeCarnes v1 (en poder del equipo).

## Datos pendientes [COMPLETAR]

- CUIT de MBEEF (footer, `lib/site.ts`)
- URL web institucional MBEEF (`lib/site.ts`)
- Párrafo de historia de MBEEF (componente `RespaldoMbeef`)
- Fotos propias de producto y de la operación (`public/images/`)
