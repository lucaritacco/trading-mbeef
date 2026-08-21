import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enviarEmail, plantilla, SITE_URL, emailConfigurado } from "@/lib/email";

// Mail de confirmación del newsletter (doble opt-in). El token viene del alta;
// leer la dirección del suscriptor necesita service_role, por eso va del server.
export async function POST(req: Request) {
  let token: unknown;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof token !== "string") return NextResponse.json({ error: "token" }, { status: 400 });

  if (!emailConfigurado) return NextResponse.json({ ok: true, skipped: "email-no-config" });
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, skipped: "admin-no-config" });

  const { data } = await admin.rpc("suscriptor_por_token", { p_token: token });
  const s = Array.isArray(data) ? data[0] : null;
  // Si ya confirmó, no se le manda otro mail: evita que el link sirva para
  // spamear a una dirección ajena pidiendo el alta una y otra vez.
  if (!s?.email || s.confirmado) return NextResponse.json({ ok: true, enviados: 0 });

  const quien = s.nombre?.split(" ")[0];
  const ok = await enviarEmail({
    to: s.email,
    subject: "Confirmá tu suscripción a DeCarnes",
    html: plantilla({
      titulo: "Confirmá tu suscripción",
      intro: `${quien ? `${quien}, t` : "T"}ocá el botón y te avisamos por mail cada vez que se publique un lote nuevo en DeCarnes.`,
      ctaLabel: "Confirmar mi suscripción",
      ctaHref: `${SITE_URL}/newsletter/confirmar?token=${token}`,
      nota: "Si no fuiste vos quien pidió esto, ignorá este mail: sin confirmar, no te llega nada más.",
    }),
  });

  return NextResponse.json({ ok: true, enviados: ok ? 1 : 0 });
}
