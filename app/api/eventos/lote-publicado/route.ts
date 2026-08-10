import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  enviarEmail,
  enviarBatch,
  plantilla,
  ADMIN_EMAIL,
  SITE_URL,
  emailConfigurado,
  type Mensaje,
} from "@/lib/email";
import { labelDe, TIPO_PRODUCTO } from "@/lib/opciones";
import { formatARS } from "@/lib/panel";

// Aviso de "lote nuevo": lo llama el navegador tras publicar. Valida que el lote
// sea del usuario logueado; recién ahí manda mail al admin y a todos los usuarios.
export async function POST(req: Request) {
  let loteId: unknown;
  try {
    ({ loteId } = await req.json());
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  if (typeof loteId !== "string") {
    return NextResponse.json({ error: "loteId" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no-auth" }, { status: 401 });

  // El lote tiene que existir y ser del usuario (RLS own select lo garantiza).
  const { data: lote } = await supabase
    .from("lotes")
    .select(
      "id, user_id, titulo, corte, tipo_producto, kilos_totales, ubicacion_provincia, ubicacion_localidad, precio_pretendido_kg, publico",
    )
    .eq("id", loteId)
    .maybeSingle();

  if (!lote || lote.user_id !== user.id) {
    return NextResponse.json({ error: "no-encontrado" }, { status: 404 });
  }

  if (!emailConfigurado) {
    return NextResponse.json({ ok: true, skipped: "email-no-config" });
  }

  const nombre = lote.titulo || labelDe(TIPO_PRODUCTO, lote.tipo_producto) || "Lote de carne";
  const ref = lote.id.slice(0, 8).toUpperCase();
  const fichaUrl = `${SITE_URL}/lote/${lote.id}`;

  // Solo provincia en el mail público (el proveedor y la localidad son anónimos).
  const filas = [
    { etiqueta: "Corte / artículo", valor: lote.corte ?? "" },
    { etiqueta: "Kilos", valor: lote.kilos_totales ? `${lote.kilos_totales} kg` : "" },
    { etiqueta: "Provincia", valor: lote.ubicacion_provincia ?? "" },
    { etiqueta: "Precio por kg", valor: lote.precio_pretendido_kg ? formatARS(lote.precio_pretendido_kg) : "" },
  ];

  // Empresa del vendedor (su propia fila de usuarios).
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("empresa")
    .eq("id", user.id)
    .maybeSingle();
  const vendedor = perfil?.empresa || user.email || "un vendedor";

  // 1) Aviso al admin.
  await enviarEmail({
    to: ADMIN_EMAIL,
    subject: `Nuevo lote publicado: ${nombre} (${ref})`,
    html: plantilla({
      titulo: "Se publicó un lote nuevo",
      intro: `${vendedor} publicó "${nombre}" en el mercado.`,
      filas,
      ctaLabel: "Ver la ficha",
      ctaHref: fichaUrl,
      nota: `Referencia ${ref}. También podés gestionarlo desde el panel: ${SITE_URL}/panel`,
    }),
  });

  // 2) Broadcast a los usuarios activos que quieren avisos (excepto el vendedor).
  //    Cada mail lleva su propio link de baja (token personal).
  const admin = createSupabaseAdmin();
  let enviados = 0;
  if (admin) {
    const subject = `Nuevo lote en el mercado: ${nombre}`;
    const armar = (token: string): Mensaje["html"] =>
      plantilla({
        titulo: "Nuevo lote disponible",
        intro: `Se sumó un lote al mercado de DeCarnes: "${nombre}".`,
        filas,
        ctaLabel: "Ver el lote",
        ctaHref: fichaUrl,
        nota: "Entrá a la ficha y consultá si te interesa.",
        bajaHref: `${SITE_URL}/avisos?token=${token}`,
      });

    // Usuarios de beta que quieren avisos (excepto el vendedor) + suscriptores.
    const { data: usuarios } = await admin.rpc("emails_usuarios_activos", { p_excluir: user.id });
    const { data: suscriptores } = await admin.rpc("emails_suscriptores");
    const destinatarios = [...(usuarios ?? []), ...(suscriptores ?? [])] as {
      email: string;
      token: string;
    }[];

    const mensajes: Mensaje[] = destinatarios.map((r) => ({
      to: r.email,
      subject,
      html: armar(r.token),
    }));
    enviados = await enviarBatch(mensajes);
  }

  return NextResponse.json({ ok: true, enviados });
}
