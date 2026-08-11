import { NextResponse } from "next/server";
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
  fotos: "Más fotos del lote",
  precio: "Precio y condiciones de pago",
};

// Consulta a un lote desde la ficha PÚBLICA (sin login). Resuelve el WhatsApp del
// dueño del lote (server-side, con service_role) y lo devuelve para que el navegador
// abra la conversación con el vendedor. Además avisa SIEMPRE al admin (MBEEF) y, si
// tiene email cargado, al dueño. Nunca expone empresa/cuit del vendedor al navegador.
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

  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true }); // sin service_role: el front usa fallback

  const { data: lote } = await admin
    .from("lotes")
    .select("id, user_id, titulo, corte, tipo_producto, kilos_totales, ubicacion_provincia, publico")
    .eq("id", loteId)
    .maybeSingle();
  if (!lote || !lote.publico) {
    return NextResponse.json({ error: "no-encontrado" }, { status: 404 });
  }

  // WhatsApp del dueño (solo el número; nunca empresa/cuit al navegador).
  const { data: dueno } = await admin
    .from("usuarios")
    .select("whatsapp")
    .eq("id", lote.user_id)
    .maybeSingle();
  const whatsapp = (dueno?.whatsapp ?? "").replace(/\D/g, "");

  // Aviso por email (best-effort; no bloquea la apertura del WhatsApp).
  if (emailConfigurado) {
    const nombre = lote.titulo || labelDe(TIPO_PRODUCTO, lote.tipo_producto) || "Lote de carne";
    const ref = lote.id.slice(0, 8).toUpperCase();
    const fichaUrl = `${SITE_URL}/lote/${lote.id}`;
    const pedido = TIPOS[tipo];
    const filas = [
      { etiqueta: "Lote", valor: `${nombre} (${ref})` },
      { etiqueta: "Consulta", valor: pedido },
      { etiqueta: "Provincia", valor: lote.ubicacion_provincia ?? "" },
    ];

    // Al admin (MBEEF): visibilidad de toda consulta del catálogo.
    await enviarEmail({
      to: ADMIN_EMAIL,
      subject: `Consulta a lote ${ref}: ${pedido}`,
      html: plantilla({
        titulo: "Nueva consulta en el catálogo",
        intro: "Alguien consultó un lote desde el catálogo público. Se le pasó el WhatsApp del vendedor.",
        filas,
        ctaLabel: "Ver la ficha",
        ctaHref: fichaUrl,
      }),
    });

    // Al dueño del lote (si tiene email), como aviso de que le van a escribir.
    const { data: emailDueno } = await admin.rpc("email_dueno_lote", { p_lote_id: loteId });
    if (typeof emailDueno === "string" && emailDueno.includes("@")) {
      await enviarEmail({
        to: emailDueno,
        subject: `Consulta sobre tu lote ${nombre} (${ref})`,
        html: plantilla({
          titulo: "Tenés una consulta",
          intro: "Un interesado consultó tu lote desde el catálogo y te va a escribir por WhatsApp.",
          filas,
          ctaLabel: "Ver la ficha",
          ctaHref: fichaUrl,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true, whatsapp });
}
