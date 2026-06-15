"use client";

import { useRef } from "react";
import { FieldShell } from "./fields";
import { MAX_DOC_BYTES, esDocumento, formatearBytes } from "@/lib/validators";

function FileRow({
  file,
  onClear,
}: {
  file: File;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border border-hueso/20 bg-carbon/40 px-4 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm text-hueso">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-salmon" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
        </svg>
        <span className="truncate">{file.name}</span>
        <span className="shrink-0 text-xs text-taupe/60">{formatearBytes(file.size)}</span>
      </span>
      <button type="button" onClick={onClear} className="shrink-0 text-xs text-taupe transition-colors hover:text-rojo-claro">
        Quitar
      </button>
    </div>
  );
}

/** Un solo archivo (PDF o imagen). */
export function SingleFileField({
  id,
  label,
  file,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function elegir(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (!esDocumento(f)) {
      onChange(null);
      alert("El archivo debe ser PDF o imagen.");
    } else if (f.size > MAX_DOC_BYTES) {
      onChange(null);
      alert(`El archivo debe pesar menos de ${formatearBytes(MAX_DOC_BYTES)}.`);
    } else {
      onChange(f);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <FieldShell label={label} required={required} error={error} hint={`PDF o imagen, hasta ${formatearBytes(MAX_DOC_BYTES)}.`}>
      {file ? (
        <FileRow file={file} onClear={() => onChange(null)} />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 border border-dashed border-hueso/25 px-4 py-4 text-sm text-taupe transition-colors hover:border-bordo hover:text-hueso"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" />
          </svg>
          Subir archivo
        </button>
      )}
      <input id={id} ref={inputRef} type="file" accept="application/pdf,image/*" onChange={(e) => elegir(e.target.files)} className="sr-only" />
    </FieldShell>
  );
}

/** Varios archivos opcionales (certificaciones). */
export function MultiFileField({
  id,
  label,
  files,
  onChange,
  hint,
  max = 5,
}: {
  id: string;
  label: string;
  files: File[];
  onChange: (f: File[]) => void;
  hint?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function agregar(list: FileList | null) {
    if (!list) return;
    const nuevos: File[] = [];
    for (const f of Array.from(list)) {
      if (esDocumento(f) && f.size <= MAX_DOC_BYTES) nuevos.push(f);
    }
    onChange([...files, ...nuevos].slice(0, max));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <FieldShell label={label} hint={hint ?? `Opcional. Hasta ${max} archivos (PDF o imagen).`}>
      <div className="space-y-2">
        {files.map((f, i) => (
          <FileRow key={i} file={f} onClear={() => onChange(files.filter((_, idx) => idx !== i))} />
        ))}
        {files.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 border border-dashed border-hueso/25 px-4 py-3 text-sm text-taupe transition-colors hover:border-bordo hover:text-hueso"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar certificación
          </button>
        )}
      </div>
      <input id={id} ref={inputRef} type="file" accept="application/pdf,image/*" multiple onChange={(e) => agregar(e.target.files)} className="sr-only" />
    </FieldShell>
  );
}
