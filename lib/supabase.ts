import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para el navegador (formulario público "Publicá tu lote").
// Usa la anon key, que es pública por diseño: la seguridad la da RLS en la base.
// La lectura de datos sensibles queda para el panel interno (service_role, lado servidor).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copiá .env.example a .env.local y completá las credenciales.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
