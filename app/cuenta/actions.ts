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

// Activar/desactivar los avisos de lotes nuevos (RLS own update: solo su fila).
export async function setAvisos(formData: FormData): Promise<void> {
  const recibir = formData.get("recibir") === "true";
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("usuarios").update({ recibir_avisos: recibir }).eq("id", user.id);
  revalidatePath("/cuenta");
  redirect("/cuenta?ok=avisos");
}

// Cerrar una búsqueda PROPIA (RLS own update la limita a las suyas).
export async function cerrarBusqueda(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase
    .from("busquedas")
    .update({ estado: "cerrada" })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath(`/cuenta/busquedas/${id}`);
  revalidatePath("/cuenta/mis-busquedas");
  redirect(`/cuenta/busquedas/${id}`);
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

// ---------- Ciclo de vida del lote (vendedor) ----------

function numeroOpcional(fd: FormData, k: string): number | null {
  const v = fd.get(k);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Marca un lote propio como vendido y guarda los datos de la operación.
 * Los números son opcionales: pedirlos como obligatorios haría que el vendedor
 * no marque el lote, y un lote vendido que sigue publicado es peor que no tener
 * el dato. Al venderse sale del catálogo (lo filtra catalogo_publico).
 */
export async function marcarVendido(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("lotes")
    .update({
      vendido: true,
      vendido_at: new Date().toISOString(),
      venta_kg: numeroOpcional(formData, "venta_kg"),
      venta_precio_kg: numeroOpcional(formData, "venta_precio_kg"),
      venta_notas: (formData.get("venta_notas") as string)?.trim() || null,
      publico: false,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/cuenta/mis-lotes");
  redirect("/cuenta/mis-lotes?ok=vendido");
}

/** Vuelve a poner en venta un lote marcado como vendido (por si fue un error). */
export async function reactivarLote(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("lotes")
    .update({ vendido: false, vendido_at: null, publico: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/cuenta/mis-lotes");
  redirect("/cuenta/mis-lotes?ok=reactivado");
}
