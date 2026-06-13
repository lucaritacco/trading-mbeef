// Datos de contacto y placeholders pendientes de completar por el equipo MBEEF.

const mbeefUrl = "[PEGAR URL REAL DE LA WEB DE MBEEF]";
const cuit = "[CUIT MBEEF]";

export const site = {
  whatsapp: "5492915382539",
  whatsappHref:
    "https://wa.me/5492915382539?text=Hola%2C%20quiero%20hablar%20con%20un%20operador%20de%20DeCarnes",
  tel: "02983 482500",
  direccion: "Juan Elicagaray 2020, Adolfo Gonzales Chaves, Buenos Aires (CP 7513)",

  // [COMPLETAR] URL de la web institucional de MBEEF.
  // Mientras no sea una URL real, los enlaces a MBEEF se renderizan como texto plano.
  mbeefUrl,
  hasMbeefUrl: /^https?:\/\//.test(mbeefUrl),

  // [COMPLETAR] CUIT de MBEEF. Si no se completa, la línea se oculta en el footer.
  cuit,
  hasCuit: !cuit.startsWith("["),
};
