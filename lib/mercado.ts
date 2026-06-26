import { createSupabaseBrowser } from "./supabase/client";

export type LoteForm = {
  titulo: string;
  corte: string;
  descripcion: string;
  // especificaciones
  especie_categoria: string;
  lote_estado: string;
  fecha_faena: string;
  disponibilidad_desde: string;
  precio_pretendido_kg: string;
  modalidad_entrega: string;
  ubicacion_provincia: string;
  ubicacion_localidad: string;
  kilos_totales: string;
  piezas_cajas: string;
  moq: string;
  vigencia_dias: string;
  envasado_tipo: string;
  certificados: string[];
};

export const LOTE_VACIO: LoteForm = {
  titulo: "",
  corte: "",
  descripcion: "",
  especie_categoria: "",
  lote_estado: "",
  fecha_faena: "",
  disponibilidad_desde: "",
  precio_pretendido_kg: "",
  modalidad_entrega: "",
  ubicacion_provincia: "",
  ubicacion_localidad: "",
  kilos_totales: "",
  piezas_cajas: "",
  moq: "",
  vigencia_dias: "",
  envasado_tipo: "",
  certificados: [],
};

function sanitizar(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
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

function filaDesde(data: LoteForm) {
  const vigencia = data.vigencia_dias ? Number(data.vigencia_dias) : null;
  const publicado_hasta =
    vigencia && vigencia > 0
      ? new Date(Date.now() + vigencia * 86400000).toISOString().slice(0, 10)
      : null;
  return {
    titulo: txt(data.titulo),
    corte: txt(data.corte),
    descripcion: txt(data.descripcion),
    especie_categoria: txt(data.especie_categoria),
    lote_estado: txt(data.lote_estado),
    fecha_faena: data.fecha_faena || null,
    disponibilidad_desde: data.disponibilidad_desde || null,
    precio_pretendido_kg: num(data.precio_pretendido_kg),
    modalidad_entrega: txt(data.modalidad_entrega),
    ubicacion_provincia: txt(data.ubicacion_provincia),
    ubicacion_localidad: txt(data.ubicacion_localidad),
    kilos_totales: num(data.kilos_totales),
    piezas_cajas: num(data.piezas_cajas),
    moq: num(data.moq),
    vigencia_dias: vigencia,
    publicado_hasta,
    envasado_tipo: txt(data.envasado_tipo),
    certificados: data.certificados.length ? data.certificados : null,
  };
}

async function subirFotos(
  supabase: ReturnType<typeof createSupabaseBrowser>,
  loteId: string,
  fotos: File[],
  desde = 0,
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < fotos.length; i++) {
    const file = fotos[i];
    const path = `${loteId}/${desde + i}-${sanitizar(file.name)}`;
    const { error } = await supabase.storage
      .from("lotes-fotos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`No pudimos subir la foto ${i + 1}: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

/** Crea un lote del mercado (publicado directo). Sube las fotos a lotes-fotos. */
export async function crearLote(data: LoteForm, fotos: File[]): Promise<string> {
  const supabase = createSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");

  const id = crypto.randomUUID();
  const fotos_paths = await subirFotos(supabase, id, fotos);

  const { error } = await supabase.from("lotes").insert({
    id,
    user_id: user.id,
    publico: true,
    estado: "publicado",
    fotos_paths,
    ...filaDesde(data),
  });
  if (error) throw new Error(error.message);
  return id;
}

/** Edita un lote propio. Si se agregan fotos nuevas, se suman a las existentes. */
export async function editarLote(
  id: string,
  data: LoteForm,
  fotosNuevas: File[],
  fotosExistentes: string[],
): Promise<void> {
  const supabase = createSupabaseBrowser();
  let fotos_paths = fotosExistentes;
  if (fotosNuevas.length) {
    const nuevas = await subirFotos(supabase, id, fotosNuevas, fotosExistentes.length);
    fotos_paths = [...fotosExistentes, ...nuevas];
  }
  const { error } = await supabase
    .from("lotes")
    .update({ fotos_paths, ...filaDesde(data) })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
