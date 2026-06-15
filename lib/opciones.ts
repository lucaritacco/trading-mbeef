// Opciones de los selectores del formulario "Publicá tu lote".

export type Opcion = { value: string; label: string };

export const TIPO_PRODUCTO: Opcion[] = [
  { value: "media_res", label: "Media res" },
  { value: "cuarto", label: "Cuarto" },
  { value: "cortes_despostados", label: "Cortes despostados" },
  { value: "menudencias", label: "Menudencias" },
  { value: "otro", label: "Otro" },
];

export const LOTE_ESTADO: Opcion[] = [
  { value: "enfriado", label: "Enfriado" },
  { value: "congelado", label: "Congelado" },
];

export const ENVASADO: Opcion[] = [
  { value: "vacio", label: "Al vacío" },
  { value: "caja", label: "En caja" },
  { value: "granel", label: "Granel" },
  { value: "otro", label: "Otro" },
];

export const CONDICION_PAGO: Opcion[] = [
  { value: "contado", label: "Contado" },
  { value: "7", label: "7 días" },
  { value: "15", label: "15 días" },
  { value: "30", label: "30 días" },
  { value: "a_convenir", label: "A convenir" },
];

export const NECESITA_FLETE: Opcion[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "a_convenir", label: "A convenir" },
];

export const PREFERENCIA_OPERACION: Opcion[] = [
  { value: "directo", label: "Vendérselo directo a MBEEF" },
  { value: "comision", label: "Que lo coloquen a comisión" },
  { value: "lo_que_convenga", label: "Lo que convenga" },
];

export const RUCA_CATEGORIA: Opcion[] = [
  { value: "frigorifico", label: "Frigorífico" },
  { value: "matarife_abastecedor", label: "Matarife abastecedor" },
  { value: "despostadero", label: "Despostadero" },
  { value: "distribuidor", label: "Distribuidor" },
];

export const HABILITACION_TIPO: Opcion[] = [
  { value: "senasa_federal", label: "SENASA · Tránsito federal" },
  { value: "senasa_provincial", label: "Provincial" },
  { value: "senasa_municipal", label: "Municipal" },
];

export const CORTES: string[] = [
  "Asado",
  "Vacío",
  "Matambre",
  "Bife ancho",
  "Bife angosto",
  "Cuadrada",
  "Nalga",
  "Bola de lomo",
  "Peceto",
  "Tapa de nalga",
  "Colita de cuadril",
  "Lomo",
  "Aguja",
  "Paleta",
  "Roast beef",
  "Tortuguita",
  "Falda",
  "Osobuco",
  "Entraña",
  "Picaña",
];

export const PROVINCIAS: string[] = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export const provinciaOpciones: Opcion[] = PROVINCIAS.map((p) => ({
  value: p,
  label: p,
}));
