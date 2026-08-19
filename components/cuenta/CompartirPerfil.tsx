"use client";

import { useState } from "react";
import CompartirWhatsapp from "@/components/CompartirWhatsapp";

/**
 * Compartir el perfil público del frigorífico. El link lleva a /vendedor/[id],
 * que muestra su nombre, su foto y todos sus lotes publicados: es la vidriera
 * que puede mandar a un cliente o poner en su firma.
 */
export default function CompartirPerfil({
  url,
  empresa,
}: {
  url: string;
  empresa: string | null;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* si el navegador bloquea el portapapeles, el link igual está a la vista */
    }
  }

  const texto = empresa
    ? `Mirá los lotes de ${empresa} en DeCarnes`
    : "Mirá mis lotes publicados en DeCarnes";

  return (
    <div className="mt-8 border border-borde bg-superficie p-6">
      <p className="font-serif text-xl font-medium text-texto">Compartí tu perfil</p>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-texto-sec">
        Este link muestra tu frigorífico con todos tus lotes publicados. Mandáselo
        a tus clientes o ponelo en tu firma: se actualiza solo cada vez que publicás.
      </p>

      <p className="mt-4 overflow-x-auto whitespace-nowrap border border-borde bg-fondo px-4 py-3 font-mono text-xs text-texto-sec">
        {url}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={copiar}
          className="border border-borde px-5 py-2.5 text-sm text-texto transition-colors hover:border-primario hover:text-primario"
        >
          {copiado ? "Link copiado ✓" : "Copiar link"}
        </button>
        <CompartirWhatsapp texto={texto} url={url} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 text-sm text-texto-sec underline underline-offset-4 transition-colors hover:text-texto"
        >
          Ver cómo lo ven
        </a>
      </div>
    </div>
  );
}
