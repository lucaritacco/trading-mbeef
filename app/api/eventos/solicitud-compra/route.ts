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
import { formatARS } from "@/lib/panel";

// Aviso al staff de que entró una solicitud de compra (búsqueda). Nace en estado
// 'pendiente': no la ve ningún vendedor hasta que se apruebe desde el panel, así
// que este mail es lo que dispara la moderación.
export async function POST(req: Request) {
  let busquedaId: unknown;
  try {
    ({ busquedaId } = await req.json());
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof busquedaId !== "string") {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }

  // Solo un usuario logueado puede disparar el aviso.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no-auth" }, { status: 401 });

  if (!emailConfigurado) return NextResponse.json({ ok: true, skipped: "email-no-config" });
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, skipped: "admin-no-config" });

  const { data } = await admin.rpc("solicitud_para_aviso", { p_id: busquedaId });
  const s = Array.isArray(data) ? data[0] : null;
  if (!s) return NextResponse.json({ error: "no-encontrada" }, { status: 404 });

  const filas = [
    { etiqueta: "Busca", valor: s.tipo_corte ?? "" },
    { etiqueta: "Categoría", valor: s.especie_categoria ?? "" },
    { etiqueta: "Cantidad", valor: s.cantidad_kg ? `${s.cantidad_kg} kg` : "" },
    { etiqueta: "Zona", valor: s.provincia ?? "" },
    { etiqueta: "Plazo", valor: s.plazo_necesario ?? "" },
    {
      etiqueta: "Precio de referencia",
      valor: s.precio_referencia != null ? `${formatARS(s.precio_referencia)}/kg` : "",
    },
    { etiqueta: "Comprador", valor: s.comprador_empresa ?? s.comprador_email ?? "" },
  ];

  await enviarEmail({
    to: ADMIN_EMAIL,
    subject: `Nueva solicitud de compra: ${s.tipo_corte ?? "sin corte"}`,
    html: plantilla({
      titulo: "Solicitud de compra para revisar",
      intro:
        "Un comprador publicó una solicitud. Queda pendiente y no la ve ningún vendedor hasta que la apruebes.",
      filas,
      ctaLabel: "Revisar solicitudes",
      ctaHref: `${SITE_URL}/panel/solicitudes-compra`,
      nota: s.notas ? `Notas: ${s.notas}` : undefined,
    }),
  });

  return NextResponse.json({ ok: true });
}
