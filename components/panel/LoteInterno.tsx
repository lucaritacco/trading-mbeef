"use client";

import { useState } from "react";
import { actualizarLote } from "@/app/panel/actions";
import {
  PIPELINE,
  semaforo,
  contadoEquivalente,
  formatARS,
  type Config,
  type Lote,
} from "@/lib/panel";
import { inputBase } from "@/lib/ui";

const COLOR_BADGE: Record<string, string> = {
  rojo: "border-error/40 bg-error-suave text-error",
  amarillo: "border-primario/40 bg-primario/10 text-primario",
  verde: "border-exito/40 bg-exito/10 text-exito",
  gris: "border-borde bg-transparent text-texto-sec",
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function LoteInterno({
  lote,
  config,
}: {
  lote: Lote;
  config: Config;
}) {
  const [estado, setEstado] = useState(lote.estado ?? "nuevo");
  const [margen, setMargen] = useState(lote.margen_bruto_pct?.toString() ?? "");
  const [ofertaMonto, setOfertaMonto] = useState(lote.oferta_monto?.toString() ?? "");
  const [ofertaPlazo, setOfertaPlazo] = useState(lote.oferta_plazo_dias?.toString() ?? "");
  const [ofertaModo, setOfertaModo] = useState(lote.oferta_modo ?? "");
  const [resultado, setResultado] = useState(lote.resultado ?? "");
  const [notas, setNotas] = useState(lote.notas_internas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const margenNum = numOrNull(margen);
  const sem = semaforo(margenNum ?? undefined, config);
  const contado = contadoEquivalente(numOrNull(ofertaMonto), numOrNull(ofertaPlazo), config.tasa_anual);

  async function guardar() {
    setGuardando(true);
    setEstadoGuardado("idle");
    setErrorMsg(null);
    const res = await actualizarLote(lote.id, {
      estado,
      margen_bruto_pct: margenNum,
      oferta_monto: numOrNull(ofertaMonto),
      oferta_plazo_dias: numOrNull(ofertaPlazo),
      oferta_modo: ofertaModo || null,
      resultado: resultado || null,
      notas_internas: notas || null,
    });
    setGuardando(false);
    if ("error" in res) {
      setEstadoGuardado("error");
      setErrorMsg(res.error);
    } else {
      setEstadoGuardado("ok");
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <div>
        <label className="mb-2 block text-sm text-texto-sec">Estado del pipeline</label>
        <div className="flex flex-wrap gap-2">
          {PIPELINE.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setEstado(p.value)}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                estado === p.value ? "border-primario bg-primario/10 text-superficie" : "border-borde text-texto-sec hover:border-borde hover:text-superficie"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Margen + semáforo */}
      <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr] sm:items-end">
        <div>
          <label htmlFor="margen" className="mb-2 block text-sm text-texto-sec">Margen bruto estimado (%)</label>
          <input id="margen" type="number" inputMode="decimal" value={margen} onChange={(e) => setMargen(e.target.value)} className={inputBase} placeholder="Ej.: 12" />
        </div>
        <div className={`border px-4 py-3 text-sm ${COLOR_BADGE[sem.color]}`}>
          <span className="text-[11px] uppercase tracking-[0.18em] opacity-80">Modo sugerido</span>
          <span className="mt-0.5 block font-medium">{sem.label}</span>
        </div>
      </div>

      {/* Oferta */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="oferta_monto" className="mb-2 block text-sm text-texto-sec">Oferta · monto (ARS)</label>
          <input id="oferta_monto" type="number" inputMode="decimal" value={ofertaMonto} onChange={(e) => setOfertaMonto(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label htmlFor="oferta_plazo" className="mb-2 block text-sm text-texto-sec">Plazo (días)</label>
          <input id="oferta_plazo" type="number" inputMode="numeric" value={ofertaPlazo} onChange={(e) => setOfertaPlazo(e.target.value)} className={inputBase} placeholder="0 = contado" />
        </div>
        <div>
          <label htmlFor="oferta_modo" className="mb-2 block text-sm text-texto-sec">Modo</label>
          <select id="oferta_modo" value={ofertaModo} onChange={(e) => setOfertaModo(e.target.value)} className={inputBase}>
            <option value="" className="bg-superficie">—</option>
            <option value="firme" className="bg-superficie">Compra en firme</option>
            <option value="comision" className="bg-superficie">Colocación a comisión</option>
          </select>
        </div>
      </div>

      {/* Contado equivalente */}
      <div className="flex items-center justify-between border border-borde bg-fondo px-4 py-3">
        <span className="text-sm text-texto-sec">
          Contado equivalente <span className="text-texto-sec">(tasa {config.tasa_anual}% anual)</span>
        </span>
        <span className="font-serif text-xl text-texto">{formatARS(contado)}</span>
      </div>

      {/* Resultado + notas */}
      <div>
        <label htmlFor="resultado" className="mb-2 block text-sm text-texto-sec">Resultado</label>
        <input id="resultado" value={resultado} onChange={(e) => setResultado(e.target.value)} className={inputBase} placeholder="Ej.: aceptó / rechazó / contraoferta…" />
      </div>
      <div>
        <label htmlFor="notas" className="mb-2 block text-sm text-texto-sec">Notas internas</label>
        <textarea id="notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={`${inputBase} resize-y`} />
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={guardar} disabled={guardando} className="bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {estadoGuardado === "ok" && <span className="text-sm text-exito">Guardado.</span>}
        {estadoGuardado === "error" && <span className="text-sm text-error">{errorMsg}</span>}
      </div>
    </div>
  );
}
