// Preguntas frecuentes de la home.
// Vive acá (y no dentro del componente) para que el JSON-LD de FAQPage y el
// acordeón visible usen exactamente el mismo texto. Google penaliza el schema
// que no coincide con lo que ve el usuario, así que no duplicar esta lista.

export type Pregunta = { q: string; a: string };

export const PREGUNTAS: Pregunta[] = [
  {
    q: "¿Qué es DeCarnes?",
    a: "Un catálogo de lotes de frigoríficos seleccionados por MBEEF, operador del mercado desde 1994.",
  },
  {
    q: "¿Cómo compro un lote?",
    a: "Consultás el lote que te interesa y coordinamos la operación con el frigorífico.",
  },
  {
    q: "¿Tiene costo consultar?",
    a: "No. Ver el catálogo y consultar es gratis.",
  },
  {
    q: "¿Y el flete?",
    a: "El retiro y el transporte se coordinan en cada operación.",
  },
  {
    q: "¿Quién selecciona los frigoríficos?",
    a: "MBEEF, con más de 30 años en el rubro. Trabajamos con proveedores que conocemos.",
  },
  {
    q: "¿Puedo vender mi stock a través de DeCarnes?",
    a: "Sí: nos pasás tu stock, lo publicamos y lo colocamos. El comprador te paga directo y cobramos comisión solo cuando se vende. Escribinos.",
  },
];
