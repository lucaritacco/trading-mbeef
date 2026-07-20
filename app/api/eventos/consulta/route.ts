import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  enviarEmail,
  plantilla,
  ADMIN_EMAIL,
  SITE_URL,
  emailConfigurado,
} from "@/lib/email";
import { labelDe, TIPO_PRODUCTO } from "@/lib/opciones";

const TIPOS: Record<string, string> = {
  gen: "Información general y disponibilidad",
  esp: "Especificaciones completas",
  cert: "Certificados (SENASA, HACCP)",
  fotos: "Más fotos del lote",
  precio: "Precio y condiciones de pago",
};

// Aviso de "consulta a un lote": lo llama el navegador cuando un usuario logueado
// aprieta un botón de consulta en la ficha. Avisa al admin y al dueño del lote.
export async function POST(req: Request) {
  let loteId: unknown;
  let tipo: unknown;
  try {
    ({ loteId, tipo } = await req.json());
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof loteId !== "string" || typeof tipo !== "string" || !TIPOS[tipo]) {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no-auth" }, { status: 401 });

  if (!emailConfigurado) {
    return NextResponse.json({ ok: true, skipped: "email-no-config" });
  }

  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, skipped: "admin-no-config" });

  // Datos del lote + email del dueño (vía service_role, el comprador no los ve).
  const { data: lote } = await admin
    .from("lotes")
    .select("id, titulo, corte, tipo_producto, kilos_totales, ubicacion_provincia, publico")
    .eq("id", loteId)
    .maybeSingle();
  if (!lote || !lote.publico) {
    return NextResponse.json({ error: "no-encontrado" }, { status: 404 });
  }
  const { data: emailDueno } = await admin.rpc("email_dueno_lote", { p_lote_id: loteId });

  // Identidad del comprador que consulta (su empresa + email).
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("empresa")
    .eq("id", user.id)
    .maybeSingle();
  const comprador = perfil?.empresa
    ? `${perfil.empresa} (${user.email})`
    : (user.email ?? "un comprador");

  const nombre = lote.titulo || labelDe(TIPO_PRODUCTO, lote.tipo_producto) || "Lote de carne";
  const ref = lote.id.slice(0, 8).toUpperCase();
  const fichaUrl = `${SITE_URL}/lote/${lote.id}`;
  const pedido = TIPOS[tipo];

  const filas = [
    { etiqueta: "Lote", valor: `${nombre} (${ref})` },
    { etiqueta: "Consulta", valor: pedido },
    { etiqueta: "De", valor: comprador },
  ];

  // Al dueño del lote.
  if (typeof emailDueno === "string" && emailDueno.includes("@")) {
    await enviarEmail({
      to: emailDueno,
      subject: `Consulta sobre tu lote ${nombre} (${ref})`,
      html: plantilla({
        titulo: "Tenés una consulta",
        intro: `${comprador} consultó sobre tu lote y te va a escribir por WhatsApp.`,
        filas,
        ctaLabel: "Ver la ficha",
        ctaHref: fichaUrl,
      }),
    });
  }

  // Al admin (visibilidad de demanda).
  await enviarEmail({
    to: ADMIN_EMAIL,
    subject: `Consulta a lote ${ref}: ${pedido}`,
    html: plantilla({
      titulo: "Nueva consulta en el mercado",
      filas,
      ctaLabel: "Ver la ficha",
      ctaHref: fichaUrl,
    }),
  });

  return NextResponse.json({ ok: true });
}
