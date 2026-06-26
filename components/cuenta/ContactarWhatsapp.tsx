"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

// Pide el WhatsApp del dueño SOLO al hacer clic (no va en el HTML del listado),
// arma el mensaje pre-cargado + link a la ficha pública y abre wa.me.
export default function ContactarWhatsapp({ loteId }: { loteId: string }) {
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function contactar() {
    setCargando(true);
    setAviso(null);
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.rpc("contacto_lote", { p_lote_id: loteId });
    setCargando(false);
    const fila = Array.isArray(data) ? data[0] : null;
    if (error || !fila) {
      setAviso("No pudimos obtener el contacto.");
      return;
    }
    const numero = (fila.whatsapp || "").replace(/\D/g, "");
    if (numero.length < 8) {
      setAviso("Este lote no tiene WhatsApp cargado. Probá la ficha pública.");
      return;
    }
    const ficha = `${window.location.origin}/lote/${loteId}`;
    const kg = fila.kilos ? `${fila.kilos} kg, ` : "";
    const prov = fila.provincia ?? "";
    const msg =
      `Hola, te escribo desde DeCarnes por el lote ${fila.titulo ?? ""} ` +
      `(${kg}${prov}). ¿Me pasás especificaciones, certificados y disponibilidad?\n${ficha}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  return (
    <div>
      <button
        type="button"
        onClick={contactar}
        disabled={cargando}
        className="w-full border border-verde-claro/40 px-4 py-2.5 text-sm text-verde-claro transition-colors hover:bg-verde/20 disabled:opacity-60"
      >
        {cargando ? "Abriendo…" : "Consultar por WhatsApp"}
      </button>
      {aviso && <p className="mt-1.5 text-xs text-salmon">{aviso}</p>}
    </div>
  );
}
