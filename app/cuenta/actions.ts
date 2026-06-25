"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

// Logout de usuarios de beta. Separado del staff (que vuelve a /panel/login).
export async function cerrarSesionUsuario(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
