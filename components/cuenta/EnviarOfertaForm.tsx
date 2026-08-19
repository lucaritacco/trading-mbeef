"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearOferta, misLotesParaOferta, type LoteParaOferta } from "@/lib/busquedas";
import { registrarEvento } from "@/components/RegistrarEvento";
import { TextField, TextArea } from "@/components/form/fields";

export default function EnviarOfertaForm({ busquedaId }: { busquedaId: string }) {
  const router = useRouter();
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [plazo, setPlazo] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  // Lotes propios publicados, para ofrecer uno ya cargado en vez de retipear todo.
  const [lotes, setLotes] = useState<LoteParaOferta[]>([]);
  const [loteId, setLoteId] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    void misLotesParaOferta().then(setLotes);
    void registrarEvento("request_quote_started", { busquedaId });
  }, [busquedaId]);

  // Elegir un lote precarga precio y cantidad: el vendedor igual puede ajustarlos.
  function elegirLote(id: string) {
    setLoteId(id);
    const l = lotes.find((x) => x.id === id);
    if (!l) return;
    if (l.precio_pretendido_kg != null) setPrecio(String(l.precio_pretendido_kg));
    if (l.kilos_totales != null) setCantidad(String(l.kilos_totales));
  }

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
        loteId: loteId || null,
      });
      setListo(true);
      setPrecio("");
      setCantidad("");
      setPlazo("");
      setNotas("");
      setLoteId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar la oferta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border border-borde bg-fondo p-6">
      <p className="font-serif text-xl font-medium text-texto">Enviar una oferta</p>
      <p className="mt-1 text-sm text-texto-sec">Cotizá esta búsqueda. El comprador compara y decide.</p>

      {listo && (
        <p className="mt-4 border border-exito/40 bg-exito/10 px-4 py-2.5 text-sm text-exito">
          Oferta enviada. Podés enviar otra si querés ajustar la propuesta.
        </p>
      )}
      {error && (
        <p className="mt-4 border border-error/40 bg-error-suave px-4 py-2.5 text-sm text-error">{error}</p>
      )}

      <div className="mt-5 space-y-5">
        {lotes.length > 0 && (
          <div>
            <p className="text-sm text-texto">¿Querés ofrecer uno de tus lotes?</p>
            <p className="mt-0.5 text-xs text-texto-sec">
              Opcional. Si elegís uno, precargamos precio y cantidad.
            </p>
            <div className="mt-3 space-y-2">
              {lotes.map((l) => (
                <label
                  key={l.id}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-2.5 text-sm transition-colors ${
                    loteId === l.id ? "border-primario bg-primario/5" : "border-borde hover:border-primario"
                  }`}
                >
                  <input
                    type="radio"
                    name="lote"
                    checked={loteId === l.id}
                    onChange={() => elegirLote(l.id)}
                    className="accent-[var(--primario)]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-texto">{l.titulo ?? l.corte ?? "Lote"}</span>
                    <span className="block text-xs text-texto-sec">
                      {[l.kilos_totales ? `${l.kilos_totales} kg` : null,
                        l.precio_pretendido_kg ? `$${l.precio_pretendido_kg}/kg` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-center gap-3 border px-4 py-2.5 text-sm transition-colors ${
                  loteId === "" ? "border-primario bg-primario/5" : "border-borde hover:border-primario"
                }`}
              >
                <input
                  type="radio"
                  name="lote"
                  checked={loteId === ""}
                  onChange={() => setLoteId("")}
                  className="accent-[var(--primario)]"
                />
                <span className="text-texto">Cotizar sin asociar lote</span>
              </label>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="precio" label="Precio por kg (ARS)" required type="number" inputMode="decimal" value={precio} onChange={setPrecio} error={errores.precio} />
          <TextField id="cantidad" label="Cantidad que ofrecés (kg)" required type="number" inputMode="decimal" value={cantidad} onChange={setCantidad} error={errores.cantidad} />
        </div>
        <TextField id="plazo" label="Plazo de entrega" placeholder="Ej.: 48 hs, esta semana" value={plazo} onChange={setPlazo} />
        <TextArea id="notas" label="Notas" placeholder="Calidad, packaging, condiciones… (opcional)" value={notas} onChange={setNotas} />
        <button type="button" onClick={enviar} disabled={enviando} className="w-full bg-primario px-6 py-3 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
          {enviando ? "Enviando…" : "Enviar oferta"}
        </button>
      </div>
    </div>
  );
}
