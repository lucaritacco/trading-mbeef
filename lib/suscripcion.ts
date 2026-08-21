import { createSupabaseBrowser } from "./supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

/**
 * Alta al newsletter, con doble opt-in: el email queda anotado pero NO recibe
 * nada hasta que la persona toca el link de confirmación.
 *
 * Devuelve "pendiente" si le mandamos ese mail, o "ya-estaba" si esa dirección
 * ya venía confirmada y no hay nada que hacer.
 */
export async function suscribir(
  nombre: string,
  email: string,
): Promise<"pendiente" | "ya-estaba"> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc("suscribir", {
    p_nombre: nombre.trim() || null,
    p_email: email.trim(),
  });
  if (error) throw new Error(error.message);

  const token = typeof data === "string" ? data : null;
  if (!token) return "ya-estaba";

  // El mail sale del servidor: leer la dirección del suscriptor necesita
  // service_role. Sin await: si falla, el alta igual quedó registrada.
  void fetch("/api/eventos/suscripcion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => {});

  return "pendiente";
}
