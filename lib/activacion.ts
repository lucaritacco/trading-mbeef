import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enviarEmail, plantilla, SITE_URL, emailConfigurado } from "@/lib/email";
import { site } from "@/lib/site";

/**
 * Activación de frigoríficos: verificados que todavía no publicaron nada.
 * Mientras no tengan lotes no existen para ningún comprador, así que la
 * verificación por sí sola no sirve de nada.
 *
 * Tres toques: al aprobarlo, a las 24 h y a los 3 días. Se cortan solos en
 * cuanto carga un lote (lo filtra frigorificos_para_activar en la base).
 */
export type Etapa = "verificado" | "24h" | "72h";

const CTA = `${SITE_URL}/cuenta/publicar`;

const COPY: Record<Etapa, { subject: string; titulo: string; intro: string; nota?: string }> = {
  verificado: {
    subject: "Tu frigorífico ya está aprobado en DeCarnes",
    titulo: "Tu frigorífico ya está aprobado ✓",
    intro:
      "Te falta un solo paso para empezar a recibir consultas: publicar tu primer lote. Los compradores solo ven a los frigoríficos que tienen stock cargado.",
  },
  "24h": {
    subject: "Te falta publicar tu primer lote",
    titulo: "Te falta un solo paso",
    intro:
      "Tu cuenta está aprobada pero todavía no publicaste ningún lote. Sin lotes no aparecés en el mercado y ningún comprador puede consultarte.",
  },
  "72h": {
    subject: "¿Te damos una mano con el primer lote?",
    titulo: "¿Te damos una mano con el primer lote?",
    intro:
      "Tu cuenta sigue aprobada y sin lotes publicados. Cargar uno lleva un par de minutos.",
    nota: `Si no tenés tiempo, mandanos tu stock por WhatsApp y lo publicamos nosotros: ${site.whatsappVenderHref}`,
  },
};

function html(etapa: Etapa, token: string | null): string {
  const c = COPY[etapa];
  return plantilla({
    titulo: c.titulo,
    intro: c.intro,
    ctaLabel: "Publicar primer lote",
    ctaHref: CTA,
    nota: c.nota,
    bajaHref: token ? `${SITE_URL}/avisos?token=${token}` : undefined,
  });
}

/** Aviso inmediato al aprobar. No manda si ya tiene lotes o no acepta avisos. */
export async function avisarVerificado(userId: string): Promise<boolean> {
  if (!emailConfigurado) return false;
  const admin = createSupabaseAdmin();
  if (!admin) return false;

  const { data } = await admin.rpc("frigorifico_contacto", { p_user_id: userId });
  const u = Array.isArray(data) ? data[0] : null;
  if (!u?.email || !u.verificado || u.tiene_lotes) return false;

  return enviarEmail({
    to: u.email,
    subject: COPY.verificado.subject,
    html: html("verificado", u.token ?? null),
  });
}

/** Recordatorio de 24 h o 3 días. Lo llama el cron. Devuelve cuántos salieron. */
export async function correrRecordatorios(etapa: "24h" | "72h"): Promise<number> {
  if (!emailConfigurado) return 0;
  const admin = createSupabaseAdmin();
  if (!admin) return 0;

  const { data } = await admin.rpc("frigorificos_para_activar", { p_etapa: etapa });
  const lista = (data ?? []) as { id: string; email: string; token: string | null }[];

  let enviados = 0;
  for (const u of lista) {
    const ok = await enviarEmail({
      to: u.email,
      subject: COPY[etapa].subject,
      html: html(etapa, u.token),
    });
    // Se marca igual si el envío falló: mejor perder un recordatorio que
    // reintentarlo todos los días contra una dirección rota.
    await admin.rpc("marcar_aviso_activacion", { p_user_id: u.id, p_etapa: etapa });
    if (ok) enviados++;
  }
  return enviados;
}
