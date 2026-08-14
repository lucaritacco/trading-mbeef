"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

// Consulta pública de un lote (sin login). Al hacer clic pide al servidor el
// WhatsApp del dueño del lote y abre la conversación con el vendedor; en paralelo
// el servidor le avisa al admin (MBEEF) que hubo una consulta. Si el vendedor no
// tiene número cargado, cae al WhatsApp de MBEEF. El número no va en el HTML.

const ESPECIFICAS = [
  { key: "esp", label: "Pedir especificaciones", q: "¿Me pasás las especificaciones completas?" },
  { key: "precio", label: "Precio y condiciones", q: "¿Me confirmás precio, disponibilidad y forma de pago?" },
  { key: "fotos", label: "Pedir más fotos", q: "¿Tenés más fotos del lote?" },
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
  fichaUrl,
}: {
  logueado: boolean;
  loteId: string;
  refCode: string;
  corte: string | null;
  kg: number | null;
  provincia: string | null;
  fichaUrl: string;
}) {
  const [cargando, setCargando] = useState<string | null>(null);

  const detalle = [corte, kg ? `${kg} kg` : null, provincia].filter(Boolean).join(", ");
  const base = `Hola, me interesa el lote ${refCode}${detalle ? ` (${detalle})` : ""}.`;

  async function consultar(key: string, pregunta: string) {
    if (cargando) return;
    setCargando(key);
    // Abrimos la ventana YA (sincrónico) para que el navegador no la bloquee;
    // después la redirigimos al WhatsApp correcto.
    const win = window.open("", "_blank");
    let numero = site.whatsapp; // fallback: WhatsApp de MBEEF
    try {
      const res = await fetch("/api/eventos/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loteId, tipo: key }),
      });
      const j = await res.json();
      if (typeof j?.whatsapp === "string" && j.whatsapp.length >= 8) numero = j.whatsapp;
    } catch {
      /* si falla el aviso, igual abrimos el WhatsApp con el fallback */
    }
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(`${base} ${pregunta}\n${fichaUrl}`)}`;
    if (win) win.location.href = url;
    else window.location.href = url;
    setCargando(null);
  }

  if (!logueado) {
    return (
      <div className="border border-borde bg-fondo p-6">
        <p className="font-serif text-xl font-medium text-texto">Consultá este lote</p>
        <p className="mt-1 text-sm text-texto-sec">
          Creá tu cuenta para consultar al frigorífico y ver el precio. Es gratis.
        </p>
        <Link
          href="/registro"
          className="mt-5 flex w-full items-center justify-center gap-2 bg-primario px-6 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover"
        >
          Crear cuenta para consultar
        </Link>
        <p className="mt-3 text-center text-sm text-texto-sec">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primario underline-offset-4 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    );
  }

  const secClass =
    "block w-full border border-borde px-5 py-3 text-left text-sm text-texto transition-colors hover:border-primario hover:bg-fondo/[0.03] disabled:opacity-60";

  return (
    <div className="border border-borde bg-fondo p-6">
      <p className="font-serif text-xl font-medium text-texto">Consultá este lote</p>
      <p className="mt-1 text-sm text-texto-sec">
        Se abre WhatsApp con el mensaje listo para enviar.
      </p>
      <button
        type="button"
        onClick={() => consultar("gen", GENERICA)}
        disabled={cargando !== null}
        className="mt-5 flex w-full items-center justify-center gap-2 bg-primario px-6 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60"
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
    </div>
  );
}
