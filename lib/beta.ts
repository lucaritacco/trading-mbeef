import { supabase } from "./supabase";

export type SolicitudData = {
  nombre_contacto: string;
  empresa: string;
  cuit: string;
  rol: string; // 'vende' | 'compra' | 'ambas'
  contacto: string;
  notas: string;
};

export const ROL_OPCIONES = [
  { value: "vende", label: "Vendo carne" },
  { value: "compra", label: "Compro carne" },
  { value: "ambas", label: "Ambas" },
];

export function rolLabel(rol: string | null): string {
  return ROL_OPCIONES.find((o) => o.value === rol)?.label ?? (rol ?? "—");
}

/** Crea una solicitud de alta (estado 'pendiente'). anon solo puede insertar. */
export async function crearSolicitud(data: SolicitudData): Promise<void> {
  const { error } = await supabase.from("solicitudes_beta").insert({
    nombre_contacto: data.nombre_contacto.trim(),
    empresa: data.empresa.trim(),
    cuit: data.cuit.trim(),
    rol: data.rol,
    contacto: data.contacto.trim(),
    notas: data.notas.trim() || null,
    estado: "pendiente",
  });
  if (error) throw new Error(error.message);
}
