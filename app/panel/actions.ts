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
