"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

// Logout de usuarios de beta. Separado del staff (que vuelve a /panel/login).
export async function cerrarSesionUsuario(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

function texto(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

// Guarda el perfil de empresa en la fila propia de `usuarios` (RLS: id = auth.uid()).
export async function guardarEmpresa(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("usuarios")
    .update({
      razon_social: texto(formData, "razon_social"),
      nombre_fantasia: texto(formData, "nombre_fantasia"),
      cuit: texto(formData, "cuit"),
      ruca_numero: texto(formData, "ruca_numero"),
      ruca_categoria: texto(formData, "ruca_categoria"),
      habilitacion_tipo: texto(formData, "habilitacion_tipo"),
      habilitacion_numero: texto(formData, "habilitacion_numero"),
      provincia: texto(formData, "provincia"),
      localidad: texto(formData, "localidad"),
      whatsapp: texto(formData, "whatsapp"),
      perfil_completo: true,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/cuenta/empresa?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/empresa");
  redirect("/cuenta?ok=empresa");
}

// Publicar / despublicar un lote PROPIO (RLS own update lo limita a los suyos).
export async function setPublicoLote(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const publico = formData.get("publico") === "true";
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServer();
  await supabase.from("lotes").update({ publico }).eq("id", id);
  revalidatePath("/cuenta/mis-lotes");
}

// Eliminar un lote PROPIO (RLS own delete lo limita a los suyos).
export async function eliminarLote(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServer();
  await supabase.from("lotes").delete().eq("id", id);
  revalidatePath("/cuenta/mis-lotes");
}
