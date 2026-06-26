"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearLote, editarLote, LOTE_VACIO, type LoteForm } from "@/lib/mercado";
import {
  CORTES,
  CERTIFICADOS,
  LOTE_ESTADO,
  ENVASADO,
  MODALIDAD_ENTREGA,
  VIGENCIA,
  provinciaOpciones,
  type Opcion,
} from "@/lib/opciones";
import {
  TextField,
  TextArea,
  SelectField,
  RadioCards,
  CheckboxChips,
} from "@/components/form/fields";
import PhotoUploader from "@/components/form/PhotoUploader";

const CORTE_OPCIONES: Opcion[] = [
  ...CORTES.map((c) => ({ value: c, label: c })),
  { value: "__otro__", label: "Otro corte" },
];

type Errores = Record<string, string>;

export default function PublicarLoteForm({
  loteId,
  initial,
  fotosExistentes = [],
}: {
  loteId?: string;
  initial?: LoteForm;
  fotosExistentes?: string[];
}) {
  const router = useRouter();
  const esEdicion = !!loteId;
  const [data, setData] = useState<LoteForm>(initial ?? LOTE_VACIO);
  const [corteOtro, setCorteOtro] = useState(
    initial && !CORTES.includes(initial.corte) ? initial.corte : "",
  );
  const [corteSel, setCorteSel] = useState(
    initial ? (CORTES.includes(initial.corte) ? initial.corte : "__otro__") : "",
  );
  const [fotos, setFotos] = useState<File[]>([]);
  const [verSpecs, setVerSpecs] = useState(esEdicion);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const set =
    <K extends keyof LoteForm>(k: K) =>
    (v: LoteForm[K]) =>
      setData((d) => ({ ...d, [k]: v }));

  function validar(): Errores {
    const e: Errores = {};
    if (!data.titulo.trim()) e.titulo = "Poné un título.";
    if (corteSel === "") e.corte = "Elegí el corte/artículo.";
    if (corteSel === "__otro__" && !corteOtro.trim()) e.corte = "Escribí qué corte es.";
    if (!esEdicion && fotos.length < 1) e.fotos = "Subí al menos 1 foto.";
    if (esEdicion && fotos.length === 0 && fotosExistentes.length === 0)
      e.fotos = "Subí al menos 1 foto.";
    return e;
  }

  async function enviar() {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    const corte = corteSel === "__otro__" ? corteOtro : corteSel;
    const payload: LoteForm = { ...data, corte };
    try {
      if (esEdicion && loteId) {
        await editarLote(loteId, payload, fotos, fotosExistentes);
      } else {
        await crearLote(payload, fotos);
      }
      router.push("/cuenta/mis-lotes");
      router.refresh();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Mercado</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        {esEdicion ? "Editar lote" : "Publicar un lote"}
      </h1>

      {errorEnvio && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">{errorEnvio}</p>
      )}

      <div className="mt-10 space-y-7">
        {/* BÁSICOS */}
        <TextField id="titulo" label="Título" required placeholder="Ej.: Asado de novillo" value={data.titulo} onChange={set("titulo")} error={errores.titulo} />
        <SelectField id="corte" label="Tipo de corte / artículo" required value={corteSel} onChange={setCorteSel} options={CORTE_OPCIONES} error={errores.corte} />
        {corteSel === "__otro__" && (
          <TextField id="corte_otro" label="¿Qué corte/artículo?" required value={corteOtro} onChange={setCorteOtro} />
        )}
        <TextArea id="descripcion" label="Descripción" placeholder="Detalles del lote (opcional)" value={data.descripcion} onChange={set("descripcion")} />
        <PhotoUploader label="Fotos" fotos={fotos} onChange={setFotos} error={errores.fotos} min={1} max={10} />
        {esEdicion && fotosExistentes.length > 0 && (
          <p className="text-xs text-taupe/70">
            Este lote ya tiene {fotosExistentes.length} foto(s). Las nuevas se suman.
          </p>
        )}

        {/* ESPECIFICACIONES (colapsables) */}
        <div className="border-t border-hueso/10 pt-6">
          <button
            type="button"
            onClick={() => setVerSpecs((v) => !v)}
            className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-salmon transition-colors hover:text-hueso"
          >
            {verSpecs ? "Ocultar" : "Mostrar"} especificaciones
            <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${verSpecs ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {verSpecs && (
          <div className="space-y-7">
            <div className="grid gap-7 sm:grid-cols-2">
              <TextField id="especie_categoria" label="Especie y categoría" placeholder="Ej.: novillo, vaquillona, vaca" value={data.especie_categoria} onChange={set("especie_categoria")} />
              <div>
                <TextField id="precio_pretendido_kg" label="Precio por kg (ARS)" type="number" inputMode="decimal" value={data.precio_pretendido_kg} onChange={set("precio_pretendido_kg")} />
                <p className="mt-1.5 text-xs text-salmon">Orientativo.</p>
              </div>
            </div>
            <RadioCards label="Estado" value={data.lote_estado} onChange={set("lote_estado")} options={LOTE_ESTADO} />
            <div className="grid gap-7 sm:grid-cols-2">
              <TextField id="fecha_faena" label="Fecha de faena" type="date" value={data.fecha_faena} onChange={set("fecha_faena")} />
              <TextField id="disponibilidad_desde" label="Lista para carga (desde)" type="date" value={data.disponibilidad_desde} onChange={set("disponibilidad_desde")} />
            </div>
            <RadioCards label="Modalidad de entrega" value={data.modalidad_entrega} onChange={set("modalidad_entrega")} options={MODALIDAD_ENTREGA} />
            <div className="grid gap-7 sm:grid-cols-2">
              <SelectField id="ubicacion_provincia" label="Provincia de retiro" value={data.ubicacion_provincia} onChange={set("ubicacion_provincia")} options={provinciaOpciones} />
              <TextField id="ubicacion_localidad" label="Localidad de retiro" value={data.ubicacion_localidad} onChange={set("ubicacion_localidad")} />
            </div>
            <div className="grid gap-7 sm:grid-cols-3">
              <TextField id="kilos_totales" label="Kg totales" type="number" inputMode="decimal" value={data.kilos_totales} onChange={set("kilos_totales")} />
              <TextField id="piezas_cajas" label="Piezas / cajas" type="number" inputMode="numeric" value={data.piezas_cajas} onChange={set("piezas_cajas")} />
              <TextField id="moq" label="Compra mínima (kg)" type="number" inputMode="decimal" value={data.moq} onChange={set("moq")} />
            </div>
            <RadioCards label="Vigencia de la publicación" value={data.vigencia_dias} onChange={set("vigencia_dias")} options={VIGENCIA} />
            <RadioCards label="Packaging" value={data.envasado_tipo} onChange={set("envasado_tipo")} options={ENVASADO} />
            <CheckboxChips label="Certificados" value={data.certificados} onChange={set("certificados")} options={CERTIFICADOS} hint="Tocá los que tengas." />
          </div>
        )}

        <div className="flex items-center justify-end gap-4 border-t border-hueso/10 pt-6">
          <button type="button" onClick={enviar} disabled={enviando} className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
            {enviando ? "Publicando…" : esEdicion ? "Guardar cambios" : "Publicar lote"}
          </button>
        </div>
      </div>
    </div>
  );
}
