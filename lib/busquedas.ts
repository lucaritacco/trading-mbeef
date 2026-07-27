import { createSupabaseBrowser } from "./supabase/client";

// ---- Tipos (lo que devuelven las funciones de la migración 0016) ----------

export type BusquedaLista = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
  precio_referencia: number | null;
  notas: string | null;
  comprador_empresa: string | null;
  es_mia: boolean;
  ofertas_count: number | null;
};

export type BusquedaDetalle = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
  precio_referencia: number | null;
  notas: string | null;
  estado: string;
  comprador_empresa: string | null;
  es_mia: boolean;
};

export type OfertaFila = {
  id: string;
  created_at: string;
  precio_por_kg: number | null;
  cantidad_ofrecida_kg: number | null;
  plazo_entrega: string | null;
  notas: string | null;
  estado: string;
  vendedor_empresa: string | null;
  es_mia: boolean;
};

export type MiBusqueda = {
  id: string;
  created_at: string;
  tipo_corte: string | null;
  especie_categoria: string | null;
  cantidad_kg: number | null;
  provincia: string | null;
  plazo_necesario: string | null;
  estado: string;
  ofertas_count: number | null;
};

export type MiOferta = {
  id: string;
  created_at: string;
  busqueda_id: string;
  precio_por_kg: number | null;
  cantidad_ofrecida_kg: number | null;
  plazo_entrega: string | null;
  estado: string;
  busqueda_corte: string | null;
  busqueda_cantidad: number | null;
  busqueda_estado: string;
};

// ---- Formularios ----------------------------------------------------------

export type BusquedaForm = {
  tipo_corte: string;
  especie_categoria: string;
  cantidad_kg: string;
  provincia: string;
  plazo_necesario: string;
  precio_referencia: string;
  notas: string;
};

export const BUSQUEDA_VACIA: BusquedaForm = {
  tipo_corte: "",
  especie_categoria: "",
  cantidad_kg: "",
  provincia: "",
  plazo_necesario: "",
  precio_referencia: "",
  notas: "",
};

export const PLAZOS = [
  { value: "Inmediato", label: "Inmediato" },
  { value: "Esta semana", label: "Esta semana" },
  { value: "2 semanas", label: "2 semanas" },
  { value: "1 mes", label: "1 mes" },
  { value: "Flexible", label: "Flexible" },
];

function num(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function txt(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

// ---- Helpers de cliente (mutaciones) --------------------------------------

/** Publica una búsqueda a nombre del usuario logueado (RLS: user_id = auth.uid()). */
export async function crearBusqueda(data: BusquedaForm): Promise<string> {
  const supabase = createSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");

  const { data: fila, error } = await supabase
    .from("busquedas")
    .insert({
      user_id: user.id,
      tipo_corte: txt(data.tipo_corte),
      especie_categoria: txt(data.especie_categoria),
      cantidad_kg: num(data.cantidad_kg),
      provincia: txt(data.provincia),
      plazo_necesario: txt(data.plazo_necesario),
      precio_referencia: num(data.precio_referencia),
      notas: txt(data.notas),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return fila.id as string;
}

/** Envía una oferta a una búsqueda (valida en el server que esté abierta y no sea propia). */
export async function crearOferta(input: {
  busquedaId: string;
  precioPorKg: string;
  cantidadKg: string;
  plazoEntrega: string;
  notas: string;
}): Promise<void> {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.rpc("crear_oferta", {
    p_busqueda_id: input.busquedaId,
    p_precio: num(input.precioPorKg),
    p_cantidad: num(input.cantidadKg),
    p_plazo: txt(input.plazoEntrega),
    p_notas: txt(input.notas),
  });
  if (error) throw new Error(error.message);
}

/** El comprador dueño acepta/rechaza una oferta de su búsqueda. */
export async function responderOferta(ofertaId: string, estado: "aceptada" | "rechazada"): Promise<void> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc("responder_oferta", {
    p_oferta_id: ofertaId,
    p_estado: estado,
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("No pudimos actualizar la oferta.");
}

/** Devuelve el WhatsApp del vendedor de una oferta ACEPTADA (solo el comprador dueño). */
export async function contactoOferta(ofertaId: string): Promise<{ whatsapp: string; empresa: string } | null> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc("contacto_oferta", { p_oferta_id: ofertaId });
  const fila = Array.isArray(data) ? data[0] : null;
  if (error || !fila) return null;
  return { whatsapp: fila.whatsapp ?? "", empresa: fila.empresa ?? "" };
}
