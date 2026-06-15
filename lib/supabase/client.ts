import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase del lado del navegador para el panel (login/logout).
// Mantiene la sesión en cookies para que el servidor la lea.
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
