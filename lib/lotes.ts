import { supabase } from "./supabase";

// ---------- Tipos del formulario ----------

export type LoteFormData = {
  // Paso 1 · El lote
  tipo_producto: string;
  especie_categoria: string;
  cortes: string[];
  cortes_otro: string;
  kilos_totales: string;
  piezas_cajas: string;
  lote_estado: string;
  fecha_faena: string;
  fecha_vencimiento: string;
  envasado_tipo: string;
  envasado_marca: string;
  ubicacion_provincia: string;
  ubicacion_localidad: string;
  observaciones_calidad: string;
  // Paso 2 · Condiciones
  precio_pretendido_kg: string;
  condicion_pago: string;
  disponibilidad_desde: string;
  necesita_flete: string;
  preferencia_operacion: string;
  // Contacto mínimo
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  cuit: string;
  acepta_contacto: boolean;
};

export type LegajoFormData = {
  razon_social: string;
  nombre_fantasia: string;
  ruca_numero: string;
  ruca_categoria: string;
  habilitacion_tipo: string;
  habilitacion_numero: string;
  empresa_provincia: string;
  empresa_localidad: string;
  referencias_comerciales: string;
  declaracion_jurada: boolean;
};

// ---------- Helpers ----------

function sanitizarNombre(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function numeroONull(v: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function textoONull(v: string): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

// ---------- Etapa A: crear el lote (cotización) ----------

export async function crearLote(
  data: LoteFormData,
  fotos: File[],
): Promise<string> {
  const id = crypto.randomUUID();

  // 1) Subir las fotos al bucket lotes-fotos, dentro de la carpeta del lote.
  const fotos_paths: string[] = [];
  for (let i = 0; i < fotos.length; i++) {
    const file = fotos[i];
    const path = `${id}/${i}-${sanitizarNombre(file.name)}`;
    const { error } = await supabase.storage
      .from("lotes-fotos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      throw new Error(`No pudimos subir la foto ${i + 1}: ${error.message}`);
    }
    fotos_paths.push(path);
  }

  // 2) Crear la fila con los datos de cotización (legajo queda pendiente).
  const { error } = await supabase.from("lotes").insert({
    id,
    estado: "nuevo",
    legajo_estado: "pendiente",
    tipo_producto: textoONull(data.tipo_producto),
    especie_categoria: textoONull(data.especie_categoria),
    cortes: data.cortes.length ? data.cortes : null,
    cortes_otro: textoONull(data.cortes_otro),
    kilos_totales: numeroONull(data.kilos_totales),
    piezas_cajas: numeroONull(data.piezas_cajas),
    lote_estado: textoONull(data.lote_estado),
    fecha_faena: data.fecha_faena || null,
    fecha_vencimiento: data.fecha_vencimiento || null,
    envasado_tipo: textoONull(data.envasado_tipo),
    envasado_marca: textoONull(data.envasado_marca),
    ubicacion_provincia: textoONull(data.ubicacion_provincia),
    ubicacion_localidad: textoONull(data.ubicacion_localidad),
    observaciones_calidad: textoONull(data.observaciones_calidad),
    fotos_paths,
    precio_pretendido_kg: numeroONull(data.precio_pretendido_kg),
    condicion_pago: textoONull(data.condicion_pago),
    disponibilidad_desde: data.disponibilidad_desde || null,
    necesita_flete: textoONull(data.necesita_flete),
    preferencia_operacion: textoONull(data.preferencia_operacion),
    contacto_nombre: textoONull(data.contacto_nombre),
    contacto_telefono: textoONull(data.contacto_telefono),
    contacto_email: textoONull(data.contacto_email),
    cuit: textoONull(data.cuit),
    acepta_contacto: data.acepta_contacto,
  });

  if (error) throw new Error(error.message);
  return id;
}

// ---------- Etapa B: completar el legajo ----------

export async function completarLegajo(
  id: string,
  data: LegajoFormData,
  archivos: { afip: File; habilitacion: File; certificaciones: File[] },
): Promise<void> {
  const subir = async (file: File, prefijo: string): Promise<string> => {
    const path = `${id}/${prefijo}-${sanitizarNombre(file.name)}`;
    const { error } = await supabase.storage
      .from("documentos")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw new Error(`No pudimos subir ${prefijo}: ${error.message}`);
    return path;
  };

  const archivo_afip_path = await subir(archivos.afip, "afip");
  const archivo_habilitacion_path = await subir(
    archivos.habilitacion,
    "habilitacion",
  );
  const archivos_certificaciones_paths: string[] = [];
  for (let i = 0; i < archivos.certificaciones.length; i++) {
    archivos_certificaciones_paths.push(
      await subir(archivos.certificaciones[i], `cert-${i}`),
    );
  }

  // La actualización pasa por una función controlada (SECURITY DEFINER) que solo
  // completa un legajo pendiente por su id y devuelve true/false. Anon no puede
  // hacer UPDATE directo sobre la tabla (ver supabase/migrations/0003_legajo_rpc.sql).
  const { data: ok, error } = await supabase.rpc("completar_legajo", {
    p_id: id,
    p_datos: {
      razon_social: textoONull(data.razon_social),
      nombre_fantasia: textoONull(data.nombre_fantasia),
      ruca_numero: textoONull(data.ruca_numero),
      ruca_categoria: textoONull(data.ruca_categoria),
      habilitacion_tipo: textoONull(data.habilitacion_tipo),
      habilitacion_numero: textoONull(data.habilitacion_numero),
      empresa_provincia: textoONull(data.empresa_provincia),
      empresa_localidad: textoONull(data.empresa_localidad),
      referencias_comerciales: textoONull(data.referencias_comerciales),
      declaracion_jurada: data.declaracion_jurada,
      archivo_afip_path,
      archivo_habilitacion_path,
      archivos_certificaciones_paths: archivos_certificaciones_paths.length
        ? archivos_certificaciones_paths
        : null,
    },
  });

  if (error) throw new Error(error.message);
  if (!ok) {
    throw new Error(
      "No encontramos ese lote, o el legajo ya fue completado. Revisá el link.",
    );
  }
}
