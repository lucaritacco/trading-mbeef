// Validaciones del formulario "Publicá tu lote".

/** Valida CUIT: formato (11 dígitos) + dígito verificador (módulo 11). */
export function validarCuit(valor: string): boolean {
  const limpio = valor.replace(/\D/g, "");
  if (limpio.length !== 11) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) suma += parseInt(limpio[i], 10) * pesos[i];
  let verificador = 11 - (suma % 11);
  if (verificador === 11) verificador = 0;
  if (verificador === 10) verificador = 9;
  return verificador === parseInt(limpio[10], 10);
}

/** Da formato XX-XXXXXXXX-X a medida que se escribe (solo dígitos). */
export function formatearCuit(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** WhatsApp: entre 8 y 15 dígitos (ignora +, espacios y guiones). */
export function validarWhatsapp(valor: string): boolean {
  const d = valor.replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15;
}

export function validarEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

// Límites de archivos.
export const MAX_FOTO_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

export function esImagen(file: File): boolean {
  return file.type.startsWith("image/");
}

export function esDocumento(file: File): boolean {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
