"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { enviarEmail, plantilla, SITE_URL } from "@/lib/email";

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

  // Al aprobar: si el contacto es un email, le mandamos el enlace de invitación.
  // Si dejó un WhatsApp, no hay a dónde mandar mail (el link se copia del panel).
  if (estado === "aprobada") {
    const { data: s } = await supabase
      .from("solicitudes_beta")
      .select("empresa, contacto, invitacion_token, invitacion_usada")
      .eq("id", id)
      .maybeSingle();
    if (s?.contacto?.includes("@") && s.invitacion_token && !s.invitacion_usada) {
      const link = `${SITE_URL}/registro?token=${s.invitacion_token}`;
      await enviarEmail({
        to: s.contacto.trim(),
        subject: "Tu acceso a DeCarnes está listo",
        html: plantilla({
          titulo: "¡Bienvenido a DeCarnes!",
          intro: `Aprobamos el acceso de ${s.empresa ?? "tu empresa"} a la beta del mercado. Creá tu cuenta con este enlace para empezar a publicar y consultar lotes.`,
          ctaLabel: "Crear mi cuenta",
          ctaHref: link,
          nota: "El enlace es de un solo uso y personal. Si no fuiste vos quien lo pidió, ignorá este mail.",
        }),
      });
    }
  }
}

// ---------- Verificación de frigoríficos ----------

/**
 * Marca/desmarca a un frigorífico como verificado. Es el permiso real: sin esto
 * no puede publicar (RLS "lotes vendedor insert") y sus lotes no muestran sello.
 * Solo staff: lo garantiza la política "usuarios staff update".
 */
export async function setVerificado(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const verificado = formData.get("verificado") === "true";
  if (typeof id !== "string") return;

  const supabase = await createSupabaseServer();
  await supabase
    .from("usuarios")
    .update({ verificado, verificado_at: verificado ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/panel/frigorificos");
  redirect("/panel/frigorificos?ok=1");
}
