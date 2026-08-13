"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearBusqueda, BUSQUEDA_VACIA, PLAZOS, type BusquedaForm } from "@/lib/busquedas";
import { CORTES, type Opcion } from "@/lib/opciones";
import { provinciaOpciones } from "@/lib/opciones";
import { TextField, TextArea, SelectField, RadioCards } from "@/components/form/fields";

const CORTE_OPCIONES: Opcion[] = [
  ...CORTES.map((c) => ({ value: c, label: c })),
  { value: "__otro__", label: "Otro / varios" },
];

export default function NuevaBusquedaForm() {
  const router = useRouter();
  const [data, setData] = useState<BusquedaForm>(BUSQUEDA_VACIA);
  const [corteSel, setCorteSel] = useState("");
  const [corteOtro, setCorteOtro] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const set =
    <K extends keyof BusquedaForm>(k: K) =>
    (v: BusquedaForm[K]) =>
      setData((d) => ({ ...d, [k]: v }));

  async function enviar() {
    const e: Record<string, string> = {};
    if (corteSel === "") e.corte = "Elegí qué corte buscás.";
    if (corteSel === "__otro__" && !corteOtro.trim()) e.corte = "Escribí qué buscás.";
    if (!data.cantidad_kg.trim()) e.cantidad_kg = "Indicá cuántos kg buscás.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    setErrorEnvio(null);
    const tipo_corte = corteSel === "__otro__" ? corteOtro : corteSel;
    try {
      const id = await crearBusqueda({ ...data, tipo_corte });
      router.push(`/cuenta/busquedas/${id}`);
      router.refresh();
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Búsquedas</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">Publicar una búsqueda</h1>
      <p className="mt-2 text-sm text-texto-sec">Contá qué estás buscando y recibí ofertas de los vendedores.</p>

      {errorEnvio && (
        <p className="mt-6 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{errorEnvio}</p>
      )}

      <div className="mt-10 space-y-7">
        <SelectField id="corte" label="¿Qué corte / artículo buscás?" required value={corteSel} onChange={setCorteSel} options={CORTE_OPCIONES} error={errores.corte} />
        {corteSel === "__otro__" && (
          <TextField id="corte_otro" label="Especificá" required value={corteOtro} onChange={setCorteOtro} />
        )}
        <div className="grid gap-7 sm:grid-cols-2">
          <TextField id="especie_categoria" label="Especie y categoría" placeholder="Ej.: novillo, vaca" value={data.especie_categoria} onChange={set("especie_categoria")} />
          <TextField id="cantidad_kg" label="Cantidad (kg)" required type="number" inputMode="decimal" value={data.cantidad_kg} onChange={set("cantidad_kg")} error={errores.cantidad_kg} />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <SelectField id="provincia" label="Zona / provincia" value={data.provincia} onChange={set("provincia")} options={provinciaOpciones} />
          <div>
            <TextField id="precio_referencia" label="Precio de referencia por kg (ARS)" type="number" inputMode="decimal" value={data.precio_referencia} onChange={set("precio_referencia")} />
            <p className="mt-1.5 text-xs text-primario">Opcional.</p>
          </div>
        </div>
        <RadioCards label="Plazo que necesitás" value={data.plazo_necesario} onChange={set("plazo_necesario")} options={PLAZOS} />
        <TextArea id="notas" label="Notas" placeholder="Detalles: calidad, packaging, condiciones… (opcional)" value={data.notas} onChange={set("notas")} />

        <div className="flex items-center justify-end gap-4 border-t border-borde pt-6">
          <button type="button" onClick={enviar} disabled={enviando} className="bg-primario px-7 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
            {enviando ? "Publicando…" : "Publicar búsqueda"}
          </button>
        </div>
      </div>
    </div>
  );
}
