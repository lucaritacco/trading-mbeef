// Tipos y utilidades del panel interno.

export type Lote = {
  id: string;
  created_at: string;
  estado: string | null;
  legajo_estado: string | null;
  publico: boolean | null;
  // Contacto
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  cuit: string | null;
  acepta_contacto: boolean | null;
  // Lote
  tipo_producto: string | null;
  especie_categoria: string | null;
  cortes: string[] | null;
  cortes_otro: string | null;
  kilos_totales: number | null;
  piezas_cajas: number | null;
  lote_estado: string | null;
  fecha_faena: string | null;
  fecha_vencimiento: string | null;
  envasado_tipo: string | null;
  envasado_marca: string | null;
  ubicacion_provincia: string | null;
  ubicacion_localidad: string | null;
  observaciones_calidad: string | null;
  fotos_paths: string[] | null;
  // Condiciones
  precio_pretendido_kg: number | null;
  condicion_pago: string | null;
  disponibilidad_desde: string | null;
  necesita_flete: string | null;
  preferencia_operacion: string | null;
  // Legajo
  razon_social: string | null;
  nombre_fantasia: string | null;
  ruca_numero: string | null;
  ruca_categoria: string | null;
  habilitacion_tipo: string | null;
  habilitacion_numero: string | null;
  empresa_provincia: string | null;
  empresa_localidad: string | null;
  referencias_comerciales: string | null;
  declaracion_jurada: boolean | null;
  archivo_afip_path: string | null;
  archivo_habilitacion_path: string | null;
  archivos_certificaciones_paths: string[] | null;
  // Campos internos
  margen_bruto_pct: number | null;
  oferta_monto: number | null;
  oferta_plazo_dias: number | null;
  oferta_modo: string | null;
  resultado: string | null;
  notas_internas: string | null;
};

export type Comprador = {
  id: string;
  created_at: string;
  nombre: string;
  contacto: string | null;
  cortes_busca: string | null;
  volumenes: string | null;
  frecuencia: string | null;
  precio_max: number | null;
  plazo_habitual: string | null;
  linea_credito: number | null;
  notas: string | null;
};

const ESTADOS_OFERTADOS = new Set(["ofertado", "aceptado", "colocado", "cobrado"]);
const ESTADOS_CONCRETADOS = new Set(["colocado", "cobrado"]);

export type LoteScorecardInput = {
  id: string;
  created_at: string;
  estado: string | null;
  observaciones_calidad: string | null;
  notas_internas: string | null;
};

/** Agregado por proveedor (mismo CUIT) sobre la tabla `lotes`. */
export function calcularScorecard(lotes: LoteScorecardInput[]) {
  const publicados = lotes.length;
  const ofertados = lotes.filter((l) => l.estado && ESTADOS_OFERTADOS.has(l.estado)).length;
  const concretados = lotes.filter((l) => l.estado && ESTADOS_CONCRETADOS.has(l.estado)).length;
  const notas = lotes
    .map((l) => ({
      fecha: l.created_at,
      texto: [l.observaciones_calidad, l.notas_internas].filter(Boolean).join(" · "),
    }))
    .filter((n) => n.texto);
  return { publicados, ofertados, concretados, notas };
}

export type PipelineEstado =
  | "nuevo"
  | "en_analisis"
  | "ofertado"
  | "aceptado"
  | "colocado"
  | "cobrado"
  | "rechazado";

export const PIPELINE: { value: PipelineEstado; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_analisis", label: "En análisis" },
  { value: "ofertado", label: "Ofertado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "colocado", label: "Colocado" },
  { value: "cobrado", label: "Cobrado" },
  { value: "rechazado", label: "Rechazado" },
];

export function pipelineLabel(estado: string | null): string {
  return PIPELINE.find((p) => p.value === estado)?.label ?? (estado ?? "—");
}

export type Config = {
  umbral_pasar: number;
  umbral_comision: number;
  tasa_anual: number;
};

export const CONFIG_DEFAULT: Config = {
  umbral_pasar: 10,
  umbral_comision: 14,
  tasa_anual: 35,
};

export type Semaforo = {
  nivel: "pasar" | "comision" | "firme" | "sin_dato";
  label: string;
  // clave de color para la UI
  color: "rojo" | "amarillo" | "verde" | "gris";
};

/** Modo sugerido según el margen bruto y los umbrales configurados. */
export function semaforo(
  margen: number | null | undefined,
  config: Config,
): Semaforo {
  if (margen === null || margen === undefined || Number.isNaN(margen)) {
    return { nivel: "sin_dato", label: "Cargá el margen", color: "gris" };
  }
  if (margen < config.umbral_pasar) {
    return { nivel: "pasar", label: "Pasar", color: "rojo" };
  }
  if (margen <= config.umbral_comision) {
    return { nivel: "comision", label: "Colocar a comisión", color: "amarillo" };
  }
  return { nivel: "firme", label: "Evaluar compra en firme", color: "verde" };
}

/**
 * Valor presente (contado equivalente) de un pago a futuro, con tasa anual
 * simple: VP = monto / (1 + tasa% * dias/365).
 */
export function contadoEquivalente(
  monto: number | null | undefined,
  dias: number | null | undefined,
  tasaAnual: number,
): number | null {
  if (monto === null || monto === undefined || Number.isNaN(monto)) return null;
  const d = dias && dias > 0 ? dias : 0;
  const factor = 1 + (tasaAnual / 100) * (d / 365);
  return monto / factor;
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return pesos.format(n);
}

export function formatFecha(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
