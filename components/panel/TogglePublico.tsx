"use client";

import { useState } from "react";
import Link from "next/link";
import { setPublico } from "@/app/panel/actions";

export default function TogglePublico({
  id,
  publico,
}: {
  id: string;
  publico: boolean;
}) {
  const [on, setOn] = useState(publico);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alternar() {
    const nuevo = !on;
    setGuardando(true);
    setError(null);
    const res = await setPublico(id, nuevo);
    setGuardando(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setOn(nuevo);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-hueso/15 bg-carbon/40 px-4 py-3">
      <button
        type="button"
        onClick={alternar}
        disabled={guardando}
        role="switch"
        aria-checked={on}
        className="flex items-center gap-3 disabled:opacity-60"
      >
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-verde" : "bg-hueso/15"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-hueso transition-all ${on ? "left-[1.4rem]" : "left-0.5"}`}
          />
        </span>
        <span className="text-sm text-hueso">
          {on ? "Ficha pública activa" : "Publicar ficha"}
        </span>
      </button>

      {on && (
        <Link
          href={`/lote/${id}`}
          target="_blank"
          className="text-xs uppercase tracking-[0.18em] text-salmon transition-colors hover:text-hueso"
        >
          Ver / compartir ficha →
        </Link>
      )}
      {error && <span className="text-xs text-rojo-claro">{error}</span>}
    </div>
  );
}
