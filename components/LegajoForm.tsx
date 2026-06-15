"use client";

import { useState } from "react";
import Link from "next/link";
import { completarLegajo, type LegajoFormData } from "@/lib/lotes";
import * as O from "@/lib/opciones";
import { TextField, TextArea, SelectField, Checkbox } from "./form/fields";
import { SingleFileField, MultiFileField } from "./form/FileField";

const EMPTY: LegajoFormData = {
  razon_social: "",
  nombre_fantasia: "",
  ruca_numero: "",
  ruca_categoria: "",
  habilitacion_tipo: "",
  habilitacion_numero: "",
  empresa_provincia: "",
  empresa_localidad: "",
  referencias_comerciales: "",
  declaracion_jurada: false,
};

type Errores = Record<string, string>;

export default function LegajoForm({ id }: { id: string }) {
  const [data, setData] = useState<LegajoFormData>(EMPTY);
  const [afip, setAfip] = useState<File | null>(null);
  const [habilitacion, setHabilitacion] = useState<File | null>(null);
  const [certificaciones, setCertificaciones] = useState<File[]>([]);
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const set =
    <K extends keyof LegajoFormData>(k: K) =>
    (v: LegajoFormData[K]) =>
      setData((d) => ({ ...d, [k]: v }));

  function validar(): Errores {
    const e: Errores = {};
    if (!data.razon_social.trim()) e.razon_social = "Indicá la razón social.";
    if (!data.ruca_numero.trim()) e.ruca_numero = "Número de RUCA.";
    if (!data.ruca_categoria) e.ruca_categoria = "Elegí la categoría.";
    if (!data.habilitacion_tipo) e.habilitacion_tipo = "Tipo de habilitación.";
    if (!data.habilitacion_numero.trim()) e.habilitacion_numero = "Número de establecimiento.";
    if (!data.empresa_provincia) e.empresa_provincia = "Elegí la provincia.";
    if (!data.empresa_localidad.trim()) e.empresa_localidad = "Indicá la localidad.";
    if (!afip) e.afip = "Subí la constancia de AFIP.";
    if (!habilitacion) e.habilitacion = "Subí la habilitación sanitaria.";
    if (!data.declaracion_jurada) e.declaracion_jurada = "Tenés que aceptar la declaración jurada.";
    return e;
  }

  async function guardar() {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setGuardando(true);
    setErrorEnvio(null);
    try {
      await completarLegajo(id, data, {
        afip: afip!,
        habilitacion: habilitacion!,
        certificaciones,
      });
      setListo(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (listo) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-36 sm:px-8">
        <div className="flex h-14 w-14 items-center justify-center border border-verde-claro/50">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-verde-claro" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1 className="mt-6 font-serif text-4xl font-medium text-hueso sm:text-5xl">
          Legajo completo.
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-taupe">
          Recibimos tus datos de empresa y la documentación. Si avanzamos con la
          operación, ya tenemos todo para concretarla.
        </p>
        <Link href="/" className="mt-8 inline-block border border-hueso/30 px-7 py-4 text-base text-hueso transition-colors hover:border-hueso/70">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-32 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Completá tu legajo</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Datos de empresa y documentación
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-taupe">
        Estos datos son el requisito para concretar la operación, no para
        publicar. Quedan asociados a tu lote{" "}
        <span className="font-mono text-xs text-hueso">{id}</span>.
      </p>

      {errorEnvio && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">
          {errorEnvio}
        </p>
      )}

      <div className="mt-10 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <TextField id="razon_social" label="Razón social" required value={data.razon_social} onChange={set("razon_social")} error={errores.razon_social} />
          <TextField id="nombre_fantasia" label="Nombre de fantasía" value={data.nombre_fantasia} onChange={set("nombre_fantasia")} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <TextField id="ruca_numero" label="Inscripción RUCA · número" required value={data.ruca_numero} onChange={set("ruca_numero")} error={errores.ruca_numero} />
          <SelectField id="ruca_categoria" label="RUCA · categoría" required value={data.ruca_categoria} onChange={set("ruca_categoria")} options={O.RUCA_CATEGORIA} error={errores.ruca_categoria} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <SelectField id="habilitacion_tipo" label="Habilitación sanitaria · tipo" required value={data.habilitacion_tipo} onChange={set("habilitacion_tipo")} options={O.HABILITACION_TIPO} error={errores.habilitacion_tipo} />
          <TextField id="habilitacion_numero" label="N° de establecimiento oficial" required value={data.habilitacion_numero} onChange={set("habilitacion_numero")} error={errores.habilitacion_numero} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <SelectField id="empresa_provincia" label="Provincia de la empresa" required value={data.empresa_provincia} onChange={set("empresa_provincia")} options={O.provinciaOpciones} error={errores.empresa_provincia} />
          <TextField id="empresa_localidad" label="Localidad" required value={data.empresa_localidad} onChange={set("empresa_localidad")} error={errores.empresa_localidad} />
        </div>

        <div className="grid gap-7 sm:grid-cols-2">
          <SingleFileField id="afip" label="Constancia de AFIP" required file={afip} onChange={setAfip} error={errores.afip} />
          <SingleFileField id="habilitacion" label="Habilitación sanitaria" required file={habilitacion} onChange={setHabilitacion} error={errores.habilitacion} />
        </div>
        <MultiFileField id="certificaciones" label="Certificaciones de calidad (HACCP, etc.)" files={certificaciones} onChange={setCertificaciones} />

        <TextArea id="referencias_comerciales" label="Referencias comerciales" placeholder="¿Con quién operás habitualmente? (opcional)" value={data.referencias_comerciales} onChange={set("referencias_comerciales")} />

        <Checkbox id="declaracion_jurada" checked={data.declaracion_jurada} onChange={set("declaracion_jurada")} error={errores.declaracion_jurada}>
          Declaro que la información y habilitaciones presentadas son veraces y se
          encuentran vigentes.
        </Checkbox>

        <div className="flex items-center justify-between pt-2">
          <Link href="/" className="text-sm text-taupe transition-colors hover:text-hueso">
            Más tarde
          </Link>
          <button type="button" onClick={guardar} disabled={guardando} className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
            {guardando ? "Guardando…" : "Guardar legajo"}
          </button>
        </div>
      </div>
    </div>
  );
}
