import { renderLoteOg, MEDIDAS } from "@/lib/og";

// Vista previa del enlace (WhatsApp, LinkedIn, X). Next la cablea sola como
// og:image y twitter:image de la ficha: no hay que declararla en la metadata.
export const alt = "Lote publicado en DeCarnes";
export const size = MEDIDAS.link;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderLoteOg(id, "link");
}
