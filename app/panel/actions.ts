"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { enviarEmail, plantilla, SITE_URL } from "@/lib/email";
import { avisarVerificado } from "@/lib/activacion";

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
  if (estado === "aprobada") await mandarInvitacion(id, false);
}

/**
 * Manda el enlace de invitación al frigorífico aprobado. Se usa al aprobar y
 * también como recordatorio para el que fue aprobado y todavía no entró.
 * No hace nada si la invitación ya se usó: el link es de un solo uso.
 */
async function mandarInvitacion(id: string, esRecordatorio: boolean): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { data: s } = await supabase
    .from("solicitudes_beta")
    .select("empresa, nombre_contacto, contacto, invitacion_token, invitacion_usada")
    .eq("id", id)
    .maybeSingle();

  if (!s?.contacto?.includes("@") || !s.invitacion_token || s.invitacion_usada) return false;

  const link = `${SITE_URL}/registro?token=${s.invitacion_token}`;
  const quien = s.nombre_contacto?.split(" ")[0] ?? null;
  const empresa = s.empresa ?? "tu empresa";

  await enviarEmail({
    to: s.contacto.trim(),
    subject: esRecordatorio
      ? "Tu acceso a DeCarnes sigue disponible"
      : "Tu acceso a DeCarnes está listo",
    html: plantilla({
      titulo: esRecordatorio
        ? `${quien ? `${quien}, t` : "T"}u lugar en la beta te está esperando`
        : "¡Bienvenido a DeCarnes!",
      intro: esRecordatorio
        ? `Te habíamos aprobado el acceso de ${empresa} pero todavía no creaste tu cuenta. El enlace sigue activo: con él publicás tus lotes y quedás visible para compradores de todo el país.`
        : `Aprobamos el acceso de ${empresa} a la beta del mercado. Creá tu cuenta con este enlace para empezar a publicar y consultar lotes.`,
      ctaLabel: esRecordatorio ? "Crear mi cuenta ahora" : "Crear mi cuenta",
      ctaHref: link,
      nota: esRecordatorio
        ? "Si preferís que te demos una mano para cargar el primer lote, respondé este mail y lo hacemos juntos."
        : "El enlace es de un solo uso y personal. Si no fuiste vos quien lo pidió, ignorá este mail.",
    }),
  });
  return true;
}

/** Reenvía la invitación a un aprobado que todavía no canjeó su cuenta. */
export async function reenviarInvitacion(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const ok = await mandarInvitacion(id, true);
  revalidatePath("/panel/solicitudes");
  redirect(`/panel/solicitudes?ok=${ok ? "recordatorio" : "sin-email"}`);
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

  // Verificar sin publicar no le sirve de nada: el mail lo empuja al primer lote.
  if (verificado) {
    try {
      await avisarVerificado(id);
    } catch {
      /* si falla el mail, la verificación igual quedó hecha */
    }
  }

  revalidatePath("/panel/frigorificos");
  redirect("/panel/frigorificos?ok=1");
}

// ---------- Solicitudes de compra (moderación) ----------

/**
 * Publica, rechaza o cierra una solicitud de compra. Nacen 'pendiente': ningún
 * vendedor las ve hasta que pasen a 'abierta'. Solo staff (policy "busquedas
 * staff update").
 */
export async function setEstadoBusqueda(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const estado = formData.get("estado");
  if (
    typeof id !== "string" ||
    typeof estado !== "string" ||
    !["pendiente", "abierta", "rechazada", "cerrada"].includes(estado)
  ) {
    return;
  }
  const supabase = await createSupabaseServer();
  await supabase.from("busquedas").update({ estado }).eq("id", id);

  // Al publicarla, avisamos a los frigoríficos verificados. Se hace por HTTP a la
  // ruta interna porque necesita service_role para leer los emails.
  if (estado === "abierta") {
    try {
      const { cookies } = await import("next/headers");
      const ck = await cookies();
      await fetch(`${SITE_URL}/api/eventos/solicitud-aprobada`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: ck.getAll().map((c) => `${c.name}=${c.value}`).join("; "),
        },
        body: JSON.stringify({ busquedaId: id }),
      });
    } catch {
      /* si falla el aviso, la solicitud igual queda publicada */
    }
    await supabase.rpc("registrar_evento", {
      p_tipo: "request_approved",
      p_busqueda_id: id,
      p_lote_id: null,
      p_meta: null,
    });
  }
  if (estado === "cerrada") {
    await supabase.rpc("registrar_evento", {
      p_tipo: "request_closed",
      p_busqueda_id: id,
      p_lote_id: null,
      p_meta: null,
    });
  }

  revalidatePath("/panel/solicitudes-compra");
  redirect("/panel/solicitudes-compra?ok=1");
}
