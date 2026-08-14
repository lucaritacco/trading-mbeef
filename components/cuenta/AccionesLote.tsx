"use client";

import { useState } from "react";
import Link from "next/link";
import { marcarVendido, reactivarLote } from "@/app/cuenta/actions";
import { setPublicoLote, eliminarLote } from "@/app/cuenta/actions";

const btn =
  "border border-borde px-3 py-1.5 text-xs text-texto transition-colors hover:border-primario";

// Acciones del vendedor sobre un lote propio. "Marcar vendido" abre un formulario
// corto en la misma tarjeta (los números son opcionales: si fueran obligatorios,
// el vendedor no marcaría el lote y quedaría publicado algo ya vendido).
export default function AccionesLote({
  id,
  publico,
  vendido,
}: {
  id: string;
  publico: boolean;
  vendido: boolean;
}) {
  const [abierto, setAbierto] = useState(false);

  if (vendido) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/cuenta/publicar?id=${id}`} className={btn}>
          Ver datos
        </Link>
        <form action={reactivarLote}>
          <input type="hidden" name="id" value={id} />
          <button className={btn}>Volver a publicar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        {publico && (
          <Link href={`/lote/${id}`} target="_blank" className={btn}>
            Ver ficha
          </Link>
        )}
        <Link href={`/cuenta/publicar?id=${id}`} className={btn}>
          Editar
        </Link>
        <form action={setPublicoLote}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="publico" value={publico ? "false" : "true"} />
          <button className={btn}>{publico ? "Pausar" : "Publicar"}</button>
        </form>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="border border-exito/50 px-3 py-1.5 text-xs text-exito transition-colors hover:bg-exito/10"
        >
          {abierto ? "Cancelar" : "Marcar vendido"}
        </button>
        <form action={eliminarLote}>
          <input type="hidden" name="id" value={id} />
          <button className="border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors hover:border-error hover:text-error">
            Eliminar
          </button>
        </form>
      </div>

      {abierto && (
        <form action={marcarVendido} className="mt-4 border border-exito/40 bg-exito/5 p-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm font-medium text-texto">Registrar la venta</p>
          <p className="mt-0.5 text-xs text-texto-sec">
            Los datos son opcionales, pero nos sirven para tu historial. El lote sale
            del catálogo.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-texto-sec">
                Kg vendidos
              </span>
              <input
                name="venta_kg"
                type="number"
                inputMode="decimal"
                className="mt-1 w-full border border-borde bg-superficie px-3 py-2 text-sm text-texto outline-none focus:border-primario"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-texto-sec">
                Precio final por kg
              </span>
              <input
                name="venta_precio_kg"
                type="number"
                inputMode="decimal"
                className="mt-1 w-full border border-borde bg-superficie px-3 py-2 text-sm text-texto outline-none focus:border-primario"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-texto-sec">
                Nota
              </span>
              <input
                name="venta_notas"
                type="text"
                placeholder="A quién, condiciones…"
                className="mt-1 w-full border border-borde bg-superficie px-3 py-2 text-sm text-texto outline-none focus:border-primario"
              />
            </label>
          </div>
          <button className="mt-4 bg-exito px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:brightness-110">
            Confirmar venta
          </button>
        </form>
      )}
    </div>
  );
}
