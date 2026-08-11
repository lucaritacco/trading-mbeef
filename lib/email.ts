import "server-only";
import { Resend } from "resend";

// Envío de emails transaccionales vía Resend. Todo el módulo es server-only:
// la API key nunca llega al navegador. Si falta RESEND_API_KEY, las funciones
// no rompen nada: registran un aviso y devuelven false (el resto de la app sigue).

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "DeCarnes <avisos@decarnes.com>";
export const ADMIN_EMAIL = process.env.EMAIL_ADMIN ?? "lucarita2006@gmail.com";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.decarnesonline.com";

export const emailConfigurado = Boolean(API_KEY);

type EnviarInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function enviarEmail({ to, subject, html }: EnviarInput): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[email] RESEND_API_KEY ausente — omitido: "${subject}"`);
    return false;
  }
  try {
    const resend = new Resend(API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] fallo al enviar:", e);
    return false;
  }
}

// Manda mensajes distintos a muchos destinatarios (cada uno puede tener su propio
// html, p. ej. con un link de baja personalizado). Usa el batch de Resend en
// tandas de 100 y nunca expone unos destinatarios a otros.
export type Mensaje = { to: string; subject: string; html: string };

export async function enviarBatch(mensajes: Mensaje[]): Promise<number> {
  if (!API_KEY) {
    console.warn(`[email] RESEND_API_KEY ausente — batch omitido (${mensajes.length})`);
    return 0;
  }
  const limpios = mensajes.filter((m) => m.to.trim());
  if (limpios.length === 0) return 0;

  const resend = new Resend(API_KEY);
  let enviados = 0;
  for (let i = 0; i < limpios.length; i += 100) {
    const tanda = limpios.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(
        tanda.map((m) => ({ from: FROM, to: m.to.trim(), subject: m.subject, html: m.html })),
      );
      if (error) console.error("[email] batch error:", error);
      else enviados += tanda.length;
    } catch (e) {
      console.error("[email] fallo en batch:", e);
    }
  }
  return enviados;
}

// -------------------------------------------------------------------------
// Plantilla HTML (estilo carbón/bordó, con estilos inline por compatibilidad).
// -------------------------------------------------------------------------

const C = {
  carbon: "#1d1d1b",
  panel: "#26251f",
  bordo: "#b30e2a",
  hueso: "#f0efe9",
  taupe: "#c3aea7",
  borde: "#3a3934",
};

export type FilaDato = { etiqueta: string; valor: string };

export function plantilla(opts: {
  titulo: string;
  intro?: string;
  filas?: FilaDato[];
  ctaLabel?: string;
  ctaHref?: string;
  nota?: string;
  bajaHref?: string;
}): string {
  const { titulo, intro, filas = [], ctaLabel, ctaHref, nota, bajaHref } = opts;

  const filasHtml = filas
    .filter((f) => f.valor)
    .map(
      (f) => `
      <tr>
        <td style="padding:6px 0;color:${C.taupe};font-size:12px;text-transform:uppercase;letter-spacing:1px;width:42%;vertical-align:top;">${escapar(f.etiqueta)}</td>
        <td style="padding:6px 0;color:${C.hueso};font-size:15px;vertical-align:top;">${escapar(f.valor)}</td>
      </tr>`,
    )
    .join("");

  const cta =
    ctaLabel && ctaHref
      ? `<a href="${ctaHref}" style="display:inline-block;margin-top:24px;background:${C.bordo};color:${C.hueso};text-decoration:none;padding:14px 28px;font-size:15px;font-weight:600;">${escapar(ctaLabel)}</a>`
      : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:${C.carbon};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:0 0 20px;">
      <span style="color:${C.hueso};font-size:20px;font-weight:700;letter-spacing:2px;">DECARNES</span>
      <span style="color:${C.taupe};font-size:11px;letter-spacing:3px;text-transform:uppercase;"> &nbsp;·&nbsp; MBEEF</span>
    </td></tr>
    <tr><td style="background:${C.panel};border:1px solid ${C.borde};padding:32px;">
      <h1 style="margin:0 0 12px;color:${C.hueso};font-size:22px;font-weight:600;">${escapar(titulo)}</h1>
      ${intro ? `<p style="margin:0 0 20px;color:${C.taupe};font-size:15px;line-height:1.6;">${escapar(intro)}</p>` : ""}
      ${filasHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.borde};margin-top:8px;padding-top:8px;">${filasHtml}</table>` : ""}
      ${cta}
      ${nota ? `<p style="margin:24px 0 0;color:${C.taupe};font-size:12px;line-height:1.6;opacity:.8;">${escapar(nota)}</p>` : ""}
    </td></tr>
    <tr><td style="padding:20px 0;color:${C.taupe};font-size:11px;opacity:.7;">
      DeCarnes · la mesa de compras de MBEEF · Thompson 1226, Bahía Blanca, Argentina
      ${bajaHref ? `<br><a href="${bajaHref}" style="color:${C.taupe};text-decoration:underline;">No quiero recibir más avisos de lotes nuevos</a>` : ""}
    </td></tr>
  </table>
</body></html>`;
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
