import { supabase } from "./supabase";

export type SolicitudData = {
  nombre_contacto: string;
  empresa: string;
  cuit: string;
  rol: string; // 'vende' | 'compra' | 'ambas'
  habilitacion_nro: string; // habilitación SENASA/provincial/municipal (solo vende/ambas)
  email: string; // obligatorio: por acá te avisamos la aprobación
  whatsapp: string; // opcional
  notas: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ¿Es un email con forma válida? */
export function emailValido(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

/** ¿El rol elegido vende (y por ende necesita habilitación)? */
export function rolVende(rol: string): boolean {
  return rol === "vende" || rol === "ambas";
}

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
  // id generado en el cliente: anon no puede leer la tabla, así que no podemos
  // recuperarlo con .select(); lo definimos acá para avisar al admin por email.
  const id = crypto.randomUUID();
  const { error } = await supabase.from("solicitudes_beta").insert({
    id,
    nombre_contacto: data.nombre_contacto.trim(),
    empresa: data.empresa.trim(),
    cuit: data.cuit.trim(),
    rol: data.rol,
    // La habilitación solo aplica a vendedores; para "compra" se guarda null.
    habilitacion_nro: rolVende(data.rol) ? data.habilitacion_nro.trim() || null : null,
    // `contacto` guarda el email (obligatorio): con él avisamos la aprobación.
    contacto: data.email.trim(),
    whatsapp: data.whatsapp.trim() || null,
    notas: data.notas.trim() || null,
    estado: "pendiente",
  });
  if (error) throw new Error(error.message);

  // Aviso al admin de que entró una nueva solicitud (sin bloquear el alta).
  void fetch("/api/eventos/solicitud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ solicitudId: id }),
  }).catch(() => {});
}
