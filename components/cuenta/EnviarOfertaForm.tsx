"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearOferta } from "@/lib/busquedas";
import { TextField, TextArea } from "@/components/form/fields";

export default function EnviarOfertaForm({ busquedaId }: { busquedaId: string }) {
  const router = useRouter();
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [plazo, setPlazo] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar() {
    const e: Record<string, string> = {};
    if (!precio.trim()) e.precio = "Poné tu precio por kg.";
    if (!cantidad.trim()) e.cantidad = "Indicá la cantidad que ofrecés.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    setError(null);
    try {
      await crearOferta({
        busquedaId,
        precioPorKg: precio,
        cantidadKg: cantidad,
        plazoEntrega: plazo,
        notas,
      });
      setListo(true);
      setPrecio("");
      setCantidad("");
      setPlazo("");
      setNotas("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar la oferta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border border-hueso/15 bg-carbon/40 p-6">
      <p className="font-serif text-xl font-medium text-hueso">Enviar una oferta</p>
      <p className="mt-1 text-sm text-taupe">Cotizá esta búsqueda. El comprador compara y decide.</p>

      {listo && (
        <p className="mt-4 border border-verde-claro/40 bg-verde/15 px-4 py-2.5 text-sm text-verde-claro">
          Oferta enviada. Podés enviar otra si querés ajustar la propuesta.
        </p>
      )}
      {error && (
        <p className="mt-4 border border-rojo/40 bg-rojo/10 px-4 py-2.5 text-sm text-rojo-claro">{error}</p>
      )}

      <div className="mt-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="precio" label="Precio por kg (ARS)" required type="number" inputMode="decimal" value={precio} onChange={setPrecio} error={errores.precio} />
          <TextField id="cantidad" label="Cantidad que ofrecés (kg)" required type="number" inputMode="decimal" value={cantidad} onChange={setCantidad} error={errores.cantidad} />
        </div>
        <TextField id="plazo" label="Plazo de entrega" placeholder="Ej.: 48 hs, esta semana" value={plazo} onChange={setPlazo} />
        <TextArea id="notas" label="Notas" placeholder="Calidad, packaging, condiciones… (opcional)" value={notas} onChange={setNotas} />
        <button type="button" onClick={enviar} disabled={enviando} className="w-full bg-bordo px-6 py-3 text-sm font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
          {enviando ? "Enviando…" : "Enviar oferta"}
        </button>
      </div>
    </div>
  );
}
