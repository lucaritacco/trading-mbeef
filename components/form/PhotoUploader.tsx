"use client";

import { useEffect, useRef, useState } from "react";
import { FieldShell } from "./fields";
import { MAX_FOTO_BYTES, esImagen, formatearBytes } from "@/lib/validators";

export default function PhotoUploader({
  label,
  fotos,
  onChange,
  error,
  min = 2,
  max = 8,
}: {
  label: string;
  fotos: File[];
  onChange: (f: File[]) => void;
  error?: string;
  min?: number;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const next = fotos.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [fotos]);

  function agregar(files: FileList | null) {
    if (!files) return;
    const nuevos: File[] = [];
    let rechazo: string | null = null;
    for (const f of Array.from(files)) {
      if (!esImagen(f)) {
        rechazo = "Solo se aceptan imágenes para las fotos.";
        continue;
      }
      if (f.size > MAX_FOTO_BYTES) {
        rechazo = `Cada foto debe pesar menos de ${formatearBytes(MAX_FOTO_BYTES)}.`;
        continue;
      }
      nuevos.push(f);
    }
    const combinados = [...fotos, ...nuevos].slice(0, max);
    if (fotos.length + nuevos.length > max) {
      rechazo = `Máximo ${max} fotos.`;
    }
    setAviso(rechazo);
    onChange(combinados);
    if (inputRef.current) inputRef.current.value = "";
  }

  function quitar(i: number) {
    onChange(fotos.filter((_, idx) => idx !== i));
    setAviso(null);
  }

  return (
    <FieldShell
      label={label}
      required
      error={error}
      hint={`Mínimo ${min}, máximo ${max}. Producto y envasado. Hasta ${formatearBytes(MAX_FOTO_BYTES)} cada una.`}
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((u, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden border border-hueso/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => quitar(i)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-carbon/80 text-hueso opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}

        {fotos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-hueso/25 text-taupe transition-colors hover:border-bordo hover:text-hueso"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[11px] uppercase tracking-[0.15em]">Agregar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => agregar(e.target.files)}
        className="sr-only"
      />

      {aviso && <p className="mt-2 text-xs text-rojo-claro">{aviso}</p>}
    </FieldShell>
  );
}
