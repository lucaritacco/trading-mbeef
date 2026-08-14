import { renderLoteOg, type FormatoOg } from "@/lib/og";
import { createSupabaseServer } from "@/lib/supabase/server";

const VALIDOS: FormatoOg[] = ["feed", "historia", "link"];

// Pieza descargable para campañas. A diferencia de og:image, esto entrega un
// archivo real: es lo que se sube como creatividad en Meta Ads, donde la vista
// previa del enlace no alcanza para controlar formato ni contenido.
//
// SOLO STAFF: es una herramienta interna. La vista previa pública del enlace la
// sirve /lote/[id]/opengraph-image, que sí es abierta (la piden WhatsApp y Google).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServer();
  const { data: esStaff } = await supabase.rpc("is_staff");
  if (!esStaff) return new Response("No autorizado", { status: 403 });

  const { id } = await params;
  const url = new URL(req.url);
  const pedido = (url.searchParams.get("f") ?? "feed") as FormatoOg;
  const formato = VALIDOS.includes(pedido) ? pedido : "feed";
  const descargar = url.searchParams.get("dl") === "1";

  const img = await renderLoteOg(id, formato);

  if (!descargar) return img;

  // Content-Disposition fuerza la descarga en vez de abrir la imagen.
  const headers = new Headers(img.headers);
  headers.set(
    "Content-Disposition",
    `attachment; filename="decarnes-${id.slice(0, 8)}-${formato}.png"`,
  );
  return new Response(img.body, { status: img.status, headers });
}
