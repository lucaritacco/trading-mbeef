// Datos de contacto y placeholders pendientes de completar por el equipo MBEEF.

const mbeefUrl = "https://mbeef.shop";
const nosotrosUrl = "https://mbeef.shop/nosotros";
const cuit = "[CUIT MBEEF]";

export const site = {
  whatsapp: "5492914145189",
  whatsappHref:
    "https://wa.me/5492914145189?text=Hola%2C%20quiero%20hablar%20con%20un%20operador%20de%20DeCarnes",
  tel: "+54 9 291 414-5189",
  direccion: "Thompson 1226, Bahía Blanca, Argentina",

  // Web institucional de MBEEF y su página "Quiénes somos".
  mbeefUrl,
  nosotrosUrl,
  hasMbeefUrl: /^https?:\/\//.test(mbeefUrl),

  // [COMPLETAR] CUIT de MBEEF. Si no se completa, la línea se oculta en el footer.
  cuit,
  hasCuit: !cuit.startsWith("["),
};
