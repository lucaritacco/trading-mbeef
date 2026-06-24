"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export type CamposLote = {
  estado?: string;
  margen_bruto_pct?: number | null;
  oferta_monto?: number | null;
  oferta_plazo_dias?: number | null;
  oferta_modo?: string | null;
  resultado?: string | null;
  notas_internas?: string | null;
};

export async function actualizarLote(
  id: string,
  campos: CamposLote,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("lotes").update(campos).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/panel");
  revalidatePath(`/panel/lote/${id}`);
  return { ok: true };
}

export async function setPublico(
  id: string,
  publico: boolean,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("lotes").update({ publico }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/panel/lote/${id}`);
  revalidatePath("/panel");
  return { ok: true };
}

export async function actualizarConfig(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase
    .from("config")
    .update({
      umbral_pasar: Number(formData.get("umbral_pasar")),
      umbral_comision: Number(formData.get("umbral_comision")),
      tasa_anual: Number(formData.get("tasa_anual")),
    })
    .eq("id", true);
  revalidatePath("/panel");
  redirect("/panel/config?ok=1");
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/panel/login");
}

// ---------- Compradores (registro de demanda) ----------

function txt(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function num(fd: FormData, k: string): number | null {
  const v = txt(fd, k);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function datosComprador(fd: FormData) {
  return {
    nombre: txt(fd, "nombre"),
    contacto: txt(fd, "contacto"),
    cortes_busca: txt(fd, "cortes_busca"),
    volumenes: txt(fd, "volumenes"),
    frecuencia: txt(fd, "frecuencia"),
    precio_max: num(fd, "precio_max"),
    plazo_habitual: txt(fd, "plazo_habitual"),
    linea_credito: num(fd, "linea_credito"),
    notas: txt(fd, "notas"),
  };
}

export async function crearComprador(formData: FormData): Promise<void> {
  const datos = datosComprador(formData);
  if (!datos.nombre) redirect("/panel/compradores?error=nombre");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("compradores").insert(datos);
  if (error) redirect(`/panel/compradores?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/panel/compradores");
  redirect("/panel/compradores?ok=creado");
}

export async function actualizarComprador(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/panel/compradores");
  const datos = datosComprador(formData);
  if (!datos.nombre) redirect(`/panel/compradores/${id}?error=nombre`);
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("compradores").update(datos).eq("id", id);
  if (error) redirect(`/panel/compradores/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/panel/compradores");
  redirect("/panel/compradores?ok=actualizado");
}

export async function borrarComprador(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/panel/compradores");
  const supabase = await createSupabaseServer();
  await supabase.from("compradores").delete().eq("id", id);
  revalidatePath("/panel/compradores");
  redirect("/panel/compradores?ok=borrado");
}

// ---------- Solicitudes de beta (aprobación manual) ----------

export async function setEstadoSolicitud(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const estado = formData.get("estado");
  if (
    typeof id !== "string" ||
    typeof estado !== "string" ||
    !["pendiente", "aprobada", "rechazada"].includes(estado)
  ) {
    return;
  }
  const supabase = await createSupabaseServer();
  await supabase.from("solicitudes_beta").update({ estado }).eq("id", id);
  revalidatePath("/panel/solicitudes");
}
