import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: SOLO para el servidor (rutas API, server actions).
// Ignora RLS, así que NUNCA debe importarse en código que corra en el navegador.
// Se usa para leer emails de usuarios (auth.users) al mandar notificaciones.
// Si falta la clave, devuelve null y el llamador debe omitir el envío sin romper.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminConfigurado = Boolean(URL && SERVICE_KEY);

export function createSupabaseAdmin() {
  if (!URL || !SERVICE_KEY) return null;
  return createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
