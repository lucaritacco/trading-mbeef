import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  enviarBatch,
  plantilla,
  SITE_URL,
  emailConfigurado,
  type Mensaje,
} from "@/lib/email";

// Difusión a los frigoríficos cuando el staff publica una solicitud. Va a los
// verificados que aceptan avisos: son los únicos que pueden cotizar.
// Nunca viajan datos del comprador, solo lo que ya es público.
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

  // Solo el staff dispara la difusión (se llama al aprobar desde el panel).
  const supabase = await createSupabaseServer();
  const { data: esStaff } = await supabase.rpc("is_staff");
  if (!esStaff) return NextResponse.json({ error: "no-autorizado" }, { status: 403 });

  if (!emailConfigurado) return NextResponse.json({ ok: true, skipped: "email-no-config" });
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, skipped: "admin-no-config" });

  const { data } = await admin.rpc("solicitud_para_difusion", { p_id: busquedaId });
  const s = Array.isArray(data) ? data[0] : null;
  if (!s || s.estado !== "abierta") {
    return NextResponse.json({ error: "no-publicada" }, { status: 404 });
  }

  const { data: destinos } = await admin.rpc("emails_frigorificos");
  const lista = (destinos ?? []) as { email: string; token: string }[];
  if (lista.length === 0) return NextResponse.json({ ok: true, enviados: 0 });

  const kg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  const corte = s.tipo_corte ?? "mercadería";
  const url = `${SITE_URL}/solicitudes/${busquedaId}`;

  const filas = [
    { etiqueta: "Busca", valor: corte },
    { etiqueta: "Cantidad", valor: s.cantidad_kg ? `${kg.format(s.cantidad_kg)} kg` : "" },
    { etiqueta: "Categoría", valor: s.especie_categoria ?? "" },
    { etiqueta: "Zona", valor: s.provincia ?? "" },
    { etiqueta: "Entrega", valor: s.plazo_necesario ?? "" },
  ];

  const mensajes: Mensaje[] = lista.map((d) => ({
    to: d.email,
    subject: `Nueva solicitud de compra: ${corte}`,
    html: plantilla({
      titulo: "Un comprador está buscando mercadería",
      intro: "Se publicó una solicitud que podés cotizar. Gana el que responde primero con buen precio.",
      filas,
      ctaLabel: "Ver y cotizar solicitud",
      ctaHref: url,
      bajaHref: `${SITE_URL}/avisos?token=${d.token}`,
    }),
  }));

  const enviados = await enviarBatch(mensajes);
  return NextResponse.json({ ok: true, enviados });
}
