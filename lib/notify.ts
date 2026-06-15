// Notificación al equipo de MBEEF cuando entra un lote nuevo (Etapa A).
//
// TODO (activación pendiente): hoy es un no-op que solo deja traza en consola.
// Para que el equipo reciba un aviso real hace falta UNA de estas opciones, y
// ninguna se incluye acá porque requiere credenciales que no se inventan:
//
//   a) Proveedor de email (ej. Resend): guardar su API key en una variable de
//      entorno del SERVIDOR (no NEXT_PUBLIC), crear una API route en
//      app/api/notify/route.ts que la use, y llamarla desde acá con fetch.
//   b) Database Webhook de Supabase sobre INSERT en `lotes` que dispare un
//      envío (email/WhatsApp) desde una Edge Function.
//
// Avisá qué proveedor preferís y lo cableamos en el próximo paso.

export async function notifyNuevoLote(loteId: string): Promise<void> {
  if (typeof console !== "undefined") {
    console.info(
      `[notify] Nuevo lote ${loteId}. Aviso al equipo pendiente de configurar (ver lib/notify.ts).`,
    );
  }
}
