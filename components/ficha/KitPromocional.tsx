"use client";

import { useState } from "react";

// Kit de campaña del lote. Las imágenes las genera el servidor con los datos
// reales (/api/og/lote/[id]); acá solo se ofrecen los formatos y el texto.
//
// Nota sobre "Crear anuncio": Meta no permite precargar una creatividad ni un
// texto desde un enlace, así que el botón hace lo único que sirve de verdad:
// deja el texto en el portapapeles y abre el Administrador de Anuncios.
export default function KitPromocional({
  loteId,
  corte,
  precio,
  kilos,
  moq,
  provincia,
  fichaUrl,
}: {
  loteId: string;
  corte: string | null;
  precio: number | null;
  kilos: number | null;
  moq: number | null;
  provincia: string | null;
  fichaUrl: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const pesos = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
  const nums = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

  const texto = [
    `${(corte ?? "Lote de carne").toUpperCase()}`,
    precio != null ? `${pesos.format(precio)}/kg` : "Precio a consultar",
    [
      kilos ? `Lote: ${nums.format(kilos)} kg` : null,
      moq ? `Compra mínima: ${nums.format(moq)} kg` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    provincia,
    "",
    `Ver detalles: ${fichaUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  async function crearAnuncio() {
    await copiar();
    window.open("https://adsmanager.facebook.com/adsmanager/manage/campaigns", "_blank", "noopener");
  }

  const descarga = (f: "feed" | "historia") => `/api/og/lote/${loteId}?f=${f}&dl=1`;
  const btn =
    "flex items-center justify-between gap-3 border border-borde bg-superficie px-4 py-3 text-left text-sm text-texto transition-colors hover:border-primario";

  return (
    <div className="border border-borde bg-fondo p-6">
      <p className="font-serif text-xl font-medium text-texto">Kit para campañas</p>
      <p className="mt-1 text-sm text-texto-sec">
        Placas listas con la foto, el precio y los datos del lote.
      </p>

      <div className="mt-5 space-y-2">
        <a href={descarga("feed")} download className={btn}>
          <span>
            Descargar para Feed
            <span className="block text-xs text-texto-sec">1080 × 1350 · Instagram y Facebook</span>
          </span>
          <span className="shrink-0 text-texto-sec">↓</span>
        </a>
        <a href={descarga("historia")} download className={btn}>
          <span>
            Descargar para Historia
            <span className="block text-xs text-texto-sec">1080 × 1920 · Stories y Reels</span>
          </span>
          <span className="shrink-0 text-texto-sec">↓</span>
        </a>
        <button type="button" onClick={copiar} className={`${btn} w-full`}>
          <span>
            {copiado ? "Texto copiado" : "Copiar texto del anuncio"}
            <span className="block text-xs text-texto-sec">Con datos y enlace al lote</span>
          </span>
          <span className="shrink-0 text-texto-sec">⧉</span>
        </button>
        <button type="button" onClick={crearAnuncio} className={`${btn} w-full`}>
          <span>
            Crear anuncio en Meta
            <span className="block text-xs text-texto-sec">
              Copia el texto y abre el Administrador
            </span>
          </span>
          <span className="shrink-0 text-texto-sec">↗</span>
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-texto-sec">
        Subí la placa como imagen del anuncio y poné este enlace en “Ver detalles”.
      </p>
    </div>
  );
}
