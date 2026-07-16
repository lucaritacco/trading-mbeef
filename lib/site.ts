// Datos de contacto y placeholders pendientes de completar por el equipo MBEEF.

const mbeefUrl = "https://mbeef.shop";
const nosotrosUrl = "https://mbeef.shop/nosotros";
const cuit = "[CUIT MBEEF]";

export const site = {
  whatsapp: "5492915382539",
  whatsappHref:
    "https://wa.me/5492915382539?text=Hola%2C%20quiero%20hablar%20con%20un%20operador%20de%20DeCarnes",
  tel: "02983 482500",
  direccion: "Thompson 1226, Bahía Blanca, Argentina",

  // Web institucional de MBEEF y su página "Quiénes somos".
  mbeefUrl,
  nosotrosUrl,
  hasMbeefUrl: /^https?:\/\//.test(mbeefUrl),

  // [COMPLETAR] CUIT de MBEEF. Si no se completa, la línea se oculta en el footer.
  cuit,
  hasCuit: !cuit.startsWith("["),
};
