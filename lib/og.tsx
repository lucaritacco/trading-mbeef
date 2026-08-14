import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import { getFicha, firmarFoto } from "@/lib/ficha";
import { TIPO_PRODUCTO, labelDe } from "@/lib/opciones";

// Piezas promocionales de un lote, generadas en el servidor a partir de los datos
// reales. Sirven para dos cosas distintas:
//   · "link"  → og:image (la vista previa al pegar el enlace).
//   · "feed" / "historia" → archivo descargable para subir a Meta Ads, WhatsApp
//     o LinkedIn, donde hace falta una imagen de verdad y no una preview.
export type FormatoOg = "feed" | "historia" | "link";

export const MEDIDAS: Record<FormatoOg, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  historia: { width: 1080, height: 1920 },
  link: { width: 1200, height: 630 },
};

const C = {
  tinta: "#14130F",
  primario: "#8C1522",
  superficie: "#FFFFFF",
  hueso: "#FAF7F2",
  taupe: "rgba(250,247,242,0.72)",
};

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const nums = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/**
 * Tipografías de marca. Se leen del propio bundle (no por HTTP): así no dependen
 * de que el sitio esté publicado ni de la red, que es lo que rompía al generar
 * la imagen antes de desplegar. Satori no acepta woff2, por eso son .woff.
 */
let cache: Awaited<ReturnType<typeof cargarFuentes>> | null = null;

// `new URL(..., import.meta.url)` es lo que hace que Next incluya el archivo en
// el despliegue; readFile es lo que funciona en el runtime de Node (fetch sobre
// file:// no está implementado).
const leerFuente = (n: string) =>
  readFile(fileURLToPath(new URL(`./fonts/${n}`, import.meta.url)));

async function cargarFuentes() {
  const [serif, sans, sansBold] = await Promise.all([
    leerFuente("garamond-600.woff"),
    leerFuente("archivo-500.woff"),
    leerFuente("archivo-700.woff"),
  ]);
  return [
    { name: "Garamond", data: serif, weight: 600 as const, style: "normal" as const },
    { name: "Archivo", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Archivo", data: sansBold, weight: 700 as const, style: "normal" as const },
  ];
}

async function fuentes() {
  if (!cache) cache = await cargarFuentes();
  return cache;
}

export async function renderLoteOg(id: string, formato: FormatoOg) {
  const f = await getFicha(id);
  const { width, height } = MEDIDAS[formato];
  const esLink = formato === "link";
  const esHistoria = formato === "historia";

  if (!f) {
    return new ImageResponse(
      (
        <div
          style={{
            width,
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.tinta,
            color: C.hueso,
            fontSize: 64,
            fontFamily: "Garamond",
          }}
        >
          DECARNES
        </div>
      ),
      { width, height },
    );
  }

  const foto = f.fotos_paths?.[0] ? await firmarFoto(f.fotos_paths[0]) : null;
  const corte = (f.corte || labelDe(TIPO_PRODUCTO, f.tipo_producto) || f.titulo || "Lote de carne").toUpperCase();
  const precio = f.precio_pretendido_kg != null ? `${pesos.format(f.precio_pretendido_kg)}/kg` : "Precio a consultar";
  const linea = [
    f.kilos_totales ? `Lote: ${nums.format(f.kilos_totales)} kg` : null,
    f.moq ? `Compra mínima: ${nums.format(f.moq)} kg` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  // Proporciones por formato: la historia respira más, el link es apaisado.
  const padding = esLink ? 56 : esHistoria ? 80 : 64;
  const tCorte = esLink ? 62 : esHistoria ? 92 : 78;
  const tPrecio = esLink ? 76 : esHistoria ? 112 : 96;
  const tDato = esLink ? 26 : esHistoria ? 36 : 31;
  const altoFoto = esLink ? "100%" : esHistoria ? "56%" : "52%";

  const Datos = ({ ancho }: { ancho?: string }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: C.tinta,
        padding,
        ...(ancho ? { width: ancho } : { flex: 1 }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", width: 44, height: 3, background: C.primario }} />
        <div
          style={{
            marginLeft: 14,
            fontSize: Math.round(tDato * 0.62),
            letterSpacing: 4,
            color: C.taupe,
          }}
        >
          {f.verificado ? "FRIGORÍFICO VERIFICADO" : "LOTE DISPONIBLE"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 18,
          fontFamily: "Garamond",
          fontSize: tCorte,
          lineHeight: 1.04,
          color: C.hueso,
        }}
      >
        {corte}
      </div>

      <div style={{ display: "flex", marginTop: 12, fontSize: tPrecio, fontWeight: 700, color: C.hueso }}>
        {precio}
      </div>

      {linea && (
        <div style={{ display: "flex", marginTop: 14, fontSize: tDato, color: C.taupe }}>{linea}</div>
      )}

      {f.ubicacion_provincia && (
        <div style={{ display: "flex", marginTop: 6, fontSize: tDato, color: C.taupe }}>
          {f.ubicacion_provincia}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", marginTop: esLink ? 24 : 34 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Garamond",
            fontSize: Math.round(tDato * 1.3),
            letterSpacing: 5,
            color: C.superficie,
          }}
        >
          DECARNES
        </div>
        <div
          style={{
            marginLeft: 14,
            display: "flex",
            fontSize: Math.round(tDato * 0.6),
            letterSpacing: 3,
            color: C.taupe,
          }}
        >
          DECARNESONLINE.COM
        </div>
      </div>
    </div>
  );

  const Foto = ({ alto }: { alto: string }) => (
    <div style={{ display: "flex", width: "100%", height: alto, background: C.primario }}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );

  return new ImageResponse(
    esLink ? (
      // Apaisado: panel sólido a la izquierda y foto a la derecha. Sin texto
      // encima de la foto, así se lee siempre, con cualquier imagen.
      <div style={{ width, height, display: "flex", background: C.tinta, fontFamily: "Archivo" }}>
        <Datos ancho="58%" />
        <div style={{ display: "flex", width: "42%", height: "100%", background: C.primario }}>
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      </div>
    ) : (
      // Vertical: foto arriba, datos abajo sobre fondo sólido.
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          background: C.tinta,
          fontFamily: "Archivo",
        }}
      >
        <Foto alto={altoFoto} />
        <Datos />
      </div>
    ),
    { width, height, fonts: await fuentes() },
  );
}
