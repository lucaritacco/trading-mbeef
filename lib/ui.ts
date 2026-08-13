// Clases compartidas de UI (sin "use client", para que las usen tanto
// componentes de servidor como de cliente).

// ---------------------------------------------------------------------------
// Paleta clara (actual). Cada superficie migrada usa estas.
// ---------------------------------------------------------------------------

export const inputBase =
  "w-full rounded-none border border-borde bg-superficie px-4 py-3 text-texto placeholder:text-texto-sec/60 outline-none transition-colors focus:border-primario";

/** Acción principal de cada pantalla. */
export const btnPrimario =
  "inline-flex items-center justify-center gap-2 bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60";

/** Secundario: mismo peso, sin relleno. */
export const btnSecundario =
  "inline-flex items-center justify-center gap-2 border border-borde px-6 py-3 text-sm font-medium text-texto transition-colors hover:border-primario hover:text-primario disabled:opacity-60";

/** Acento: solo publicar / beta / invitación. Texto carbón (blanco no pasa AA). */
export const btnAcento =
  "inline-flex items-center justify-center gap-2 bg-acento px-6 py-3 text-sm font-semibold text-texto transition-colors hover:brightness-95 disabled:opacity-60";

/** Aviso de error (validaciones). El rojo vive solo acá. */
export const avisoError =
  "border border-error/40 bg-error-suave px-4 py-3 text-sm text-error";

/** Aviso de éxito / confirmación. */
export const avisoExito =
  "border border-exito/40 bg-exito/10 px-4 py-3 text-sm text-exito";
