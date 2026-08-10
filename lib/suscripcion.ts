import { createSupabaseBrowser } from "./supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

/** Alta liviana: suma el email a la lista de avisos de lotes nuevos (upsert por email). */
export async function suscribir(nombre: string, email: string): Promise<void> {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.rpc("suscribir", {
    p_nombre: nombre.trim() || null,
    p_email: email.trim(),
  });
  if (error) throw new Error(error.message);
}
