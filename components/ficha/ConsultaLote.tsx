"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";

// Columna de consulta de la ficha pública (estilo MeatBorsa).
// - Visitante SIN login: los botones llevan a /login (nunca se llama contacto_lote
//   ni se expone el WhatsApp del dueño).
// - Visitante logueado (usuario beta): al hacer clic se pide el número al dueño vía
//   contacto_lote (ya restringida a authenticated) y se abre wa.me con el mensaje
//   pre-cargado de cada botón + referencia + link a la ficha. El número nunca va en el HTML.

const ESPECIFICAS = [
  { key: "esp", label: "Pedir especificaciones", q: "¿Me pasás las especificaciones completas?" },
  { key: "cert", label: "Pedir certificados", q: "¿Me pasás los certificados disponibles (SENASA, HACCP)?" },
  { key: "fotos", label: "Pedir más fotos", q: "¿Tenés más fotos del lote?" },
  { key: "precio", label: "Precio y condiciones", q: "¿Me confirmás precio, disponibilidad y forma de pago?" },
] as const;

const GENERICA = "¿Me pasás más información y disponibilidad?";

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.917z" />
    </svg>
  );
}

export default function ConsultaLote({
  logueado,
  loteId,
  refCode,
  corte,
  kg,
  provincia,
}: {
  logueado: boolean;
  loteId: string;
  refCode: string;
  corte: string | null;
  kg: number | null;
  provincia: string | null;
}) {
  const [cargando, setCargando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const primaryClass =
    "flex w-full items-center justify-center gap-2 bg-bordo px-6 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60";
  const secClass =
    "block w-full border border-hueso/20 px-5 py-3 text-left text-sm text-hueso transition-colors hover:border-bordo hover:bg-hueso/[0.03] disabled:opacity-60";

  function baseMsg() {
    const detalle = [corte, kg ? `${kg} kg` : null, provincia].filter(Boolean).join(", ");
    return `Hola, me interesa el lote ${refCode}${detalle ? ` (${detalle})` : ""}.`;
  }

  async function consultar(key: string, pregunta: string) {
    setCargando(key);
    setAviso(null);
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.rpc("contacto_lote", { p_lote_id: loteId });
    setCargando(null);
    const fila = Array.isArray(data) ? data[0] : null;
    if (error || !fila) {
      setAviso("No pudimos obtener el contacto. Probá de nuevo.");
      return;
    }
    const numero = (fila.whatsapp || "").replace(/\D/g, "");
    if (numero.length < 8) {
      setAviso("El vendedor todavía no cargó su WhatsApp.");
      return;
    }
    // Avisa por email al vendedor y al admin (sin bloquear la apertura de WhatsApp).
    void fetch("/api/eventos/consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loteId, tipo: key }),
    }).catch(() => {});

    const ficha = `${window.location.origin}/lote/${loteId}`;
    const msg = `${baseMsg()} ${pregunta}\n${ficha}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  if (!logueado) {
    return (
      <div className="border border-hueso/15 bg-carbon/40 p-6">
        <p className="font-serif text-xl font-medium text-hueso">Consultá este lote</p>
        <p className="mt-1 text-sm text-taupe">
          Iniciá sesión para contactar al vendedor por WhatsApp.
        </p>
        <Link href="/login" className={`${primaryClass} mt-5`}>
          <WhatsappIcon />
          Iniciar sesión para consultar
        </Link>
        <div className="mt-3 space-y-2">
          {ESPECIFICAS.map((b) => (
            <Link key={b.key} href="/login" className={secClass}>
              {b.label}
            </Link>
          ))}
        </div>
        <p className="mt-5 border-t border-hueso/10 pt-4 text-xs text-taupe">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/sumate" className="text-salmon underline-offset-2 hover:underline">
            Sumate al mercado
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="border border-hueso/15 bg-carbon/40 p-6">
      <p className="font-serif text-xl font-medium text-hueso">Consultá al vendedor</p>
      <p className="mt-1 text-sm text-taupe">
        Elegí qué querés preguntar; se abre WhatsApp con el mensaje listo.
      </p>
      <button
        type="button"
        onClick={() => consultar("gen", GENERICA)}
        disabled={cargando !== null}
        className={`${primaryClass} mt-5`}
      >
        <WhatsappIcon />
        {cargando === "gen" ? "Abriendo…" : "Consultar por WhatsApp"}
      </button>
      <div className="mt-3 space-y-2">
        {ESPECIFICAS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => consultar(b.key, b.q)}
            disabled={cargando !== null}
            className={secClass}
          >
            {cargando === b.key ? "Abriendo…" : b.label}
          </button>
        ))}
      </div>
      {aviso && <p className="mt-4 text-xs text-salmon">{aviso}</p>}
    </div>
  );
}
