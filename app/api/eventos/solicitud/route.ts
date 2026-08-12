import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  enviarEmail,
  plantilla,
  ADMIN_EMAIL,
  SITE_URL,
  emailConfigurado,
} from "@/lib/email";
import { rolLabel } from "@/lib/beta";

// Aviso al admin de que entró una nueva solicitud de alta (/sumate). Lo llama el
// navegador tras crear la solicitud; lee la fila con service_role (anon no puede
// leerla) y le manda el resumen al admin para que la apruebe desde el panel.
export async function POST(req: Request) {
  let solicitudId: unknown;
  try {
    ({ solicitudId } = await req.json());
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof solicitudId !== "string") {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }

  if (!emailConfigurado) return NextResponse.json({ ok: true, skipped: "email-no-config" });
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, skipped: "admin-no-config" });

  const { data: s } = await admin
    .from("solicitudes_beta")
    .select("nombre_contacto, empresa, cuit, rol, habilitacion_nro, contacto, whatsapp, notas")
    .eq("id", solicitudId)
    .maybeSingle();
  if (!s) return NextResponse.json({ error: "no-encontrado" }, { status: 404 });

  const filas = [
    { etiqueta: "Empresa", valor: s.empresa ?? "" },
    { etiqueta: "Contacto", valor: s.nombre_contacto ?? "" },
    { etiqueta: "Rol", valor: rolLabel(s.rol) },
    { etiqueta: "CUIT", valor: s.cuit ?? "" },
    { etiqueta: "Habilitación", valor: s.habilitacion_nro ?? "" },
    { etiqueta: "Email", valor: s.contacto ?? "" },
    { etiqueta: "WhatsApp", valor: s.whatsapp ?? "" },
  ];

  await enviarEmail({
    to: ADMIN_EMAIL,
    subject: `Nueva solicitud de alta: ${s.empresa || s.nombre_contacto || "sin nombre"}`,
    html: plantilla({
      titulo: "Nueva solicitud para sumarse",
      intro: "Alguien completó el formulario de /sumate. Revisala y aprobala desde el panel.",
      filas,
      ctaLabel: "Ver solicitudes",
      ctaHref: `${SITE_URL}/panel/solicitudes`,
      nota: s.notas ? `Comentario: ${s.notas}` : undefined,
    }),
  });

  return NextResponse.json({ ok: true });
}
