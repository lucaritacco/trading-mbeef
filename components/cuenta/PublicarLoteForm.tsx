"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearLote, editarLote, LOTE_VACIO, type LoteForm } from "@/lib/mercado";
import {
  CORTES,
  CERTIFICADOS,
  LOTE_ESTADO,
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

type FotoExistente = { path: string; url: string | null };

export default function PublicarLoteForm({
  loteId,
  initial,
  fotosExistentes = [],
}: {
  loteId?: string;
  initial?: LoteForm;
  fotosExistentes?: FotoExistente[];
}) {
  const router = useRouter();
  const esEdicion = !!loteId;
  const [data, setData] = useState<LoteForm>(initial ?? LOTE_VACIO);
  // Fotos ya subidas: se pueden reordenar (portada = la primera) y eliminar.
  const [existentes, setExistentes] = useState<FotoExistente[]>(fotosExistentes);

  const hacerPortada = (path: string) =>
    setExistentes((fs) => {
      const el = fs.find((f) => f.path === path);
      if (!el) return fs;
      return [el, ...fs.filter((f) => f.path !== path)];
    });
  const eliminarExistente = (path: string) =>
    setExistentes((fs) => fs.filter((f) => f.path !== path));
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
    if (esEdicion && fotos.length === 0 && existentes.length === 0)
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
        await editarLote(loteId, payload, fotos, existentes.map((f) => f.path));
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
      <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Mercado</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">
        {esEdicion ? "Editar lote" : "Publicar un lote"}
      </h1>

      {errorEnvio && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{errorEnvio}</p>
      )}

      <div className="mt-10 space-y-7">
        {/* BÁSICOS */}
        <TextField id="titulo" label="Título" required placeholder="Ej.: Asado de novillo" value={data.titulo} onChange={set("titulo")} error={errores.titulo} />
        <SelectField id="corte" label="Tipo de corte / artículo" required value={corteSel} onChange={setCorteSel} options={CORTE_OPCIONES} error={errores.corte} />
        {corteSel === "__otro__" && (
          <TextField id="corte_otro" label="¿Qué corte/artículo?" required value={corteOtro} onChange={setCorteOtro} />
        )}
        <TextArea id="descripcion" label="Descripción" placeholder="Detalles del lote (opcional)" value={data.descripcion} onChange={set("descripcion")} />
        {/* Fotos ya subidas (solo en edición): elegir portada y eliminar */}
        {esEdicion && existentes.length > 0 && (
          <div>
            <p className="text-sm text-texto">Fotos actuales</p>
            <p className="mt-1 text-xs text-texto-sec">
              La <span className="text-primario">portada</span> es la primera y es la que se ve
              al compartir. Tocá una foto para hacerla portada, o eliminala.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {existentes.map((f, i) => (
                <div
                  key={f.path}
                  className={`group relative aspect-square overflow-hidden border ${i === 0 ? "border-primario" : "border-borde"}`}
                >
                  {f.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-texto-sec">
                      Sin vista previa
                    </span>
                  )}

                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 bg-primario px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-superficie">
                      Portada
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => eliminarExistente(f.path)}
                    aria-label="Eliminar foto"
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-fondo text-superficie transition-colors hover:bg-primario-hover"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>

                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => hacerPortada(f.path)}
                      className="absolute inset-x-0 bottom-0 bg-fondo py-1.5 text-[11px] text-superficie transition-colors hover:bg-primario"
                    >
                      Hacer portada
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <PhotoUploader
          label={esEdicion ? "Agregar fotos nuevas" : "Fotos"}
          fotos={fotos}
          onChange={setFotos}
          error={errores.fotos}
          min={esEdicion ? 0 : 1}
          max={10}
        />
        {esEdicion && (
          <p className="text-xs text-texto-sec">
            Las fotos nuevas se suman al final. Para que una nueva sea la portada,
            guardá y volvé a editar.
          </p>
        )}

        {/* ESPECIFICACIONES (colapsables) */}
        <div className="border-t border-borde pt-6">
          <button
            type="button"
            onClick={() => setVerSpecs((v) => !v)}
            className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-primario transition-colors hover:text-texto"
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
                <p className="mt-1.5 text-xs text-primario">Orientativo.</p>
              </div>
            </div>
            <RadioCards label="Estado" value={data.lote_estado} onChange={set("lote_estado")} options={LOTE_ESTADO} />
            <div className="grid gap-7 sm:grid-cols-3">
              <TextField id="fecha_faena" label="Fecha de faena" type="date" value={data.fecha_faena} onChange={set("fecha_faena")} />
              <TextField id="fecha_vencimiento" label="Fecha de vencimiento" type="date" value={data.fecha_vencimiento} onChange={set("fecha_vencimiento")} />
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
            <CheckboxChips label="Certificados" value={data.certificados} onChange={set("certificados")} options={CERTIFICADOS} hint="Tocá los que tengas." />
          </div>
        )}

        <div className="flex items-center justify-end gap-4 border-t border-borde pt-6">
          <button type="button" onClick={enviar} disabled={enviando} className="bg-primario px-7 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
            {enviando ? "Publicando…" : esEdicion ? "Guardar cambios" : "Publicar lote"}
          </button>
        </div>
      </div>
    </div>
  );
}
