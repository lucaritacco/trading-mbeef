"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { responderOferta, contactoOferta, type OfertaFila } from "@/lib/busquedas";
import { formatARS } from "@/lib/panel";

const ESTADO_BADGE: Record<string, string> = {
  enviada: "border-borde text-texto-sec",
  aceptada: "border-exito/40 text-exito",
  rechazada: "border-error/40 text-error",
};

export default function OfertasComprador({
  ofertas,
  abierta,
}: {
  ofertas: OfertaFila[];
  abierta: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function responder(id: string, estado: "aceptada" | "rechazada") {
    setCargando(id);
    setAviso(null);
    try {
      await responderOferta(id, estado);
      router.refresh();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "No pudimos actualizar la oferta.");
    } finally {
      setCargando(null);
    }
  }

  async function verContacto(id: string) {
    setCargando(id);
    setAviso(null);
    const c = await contactoOferta(id);
    setCargando(null);
    if (!c) {
      setAviso("No pudimos obtener el contacto.");
      return;
    }
    const numero = c.whatsapp.replace(/\D/g, "");
    if (numero.length < 8) {
      setAviso(`${c.empresa || "El vendedor"} no tiene WhatsApp cargado.`);
      return;
    }
    const msg = `Hola${c.empresa ? ` ${c.empresa}` : ""}, acepté tu oferta en DeCarnes. Coordinemos.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  if (ofertas.length === 0) {
    return (
      <div className="border border-dashed border-borde px-6 py-12 text-center">
        <p className="text-texto">Todavía no recibiste ofertas.</p>
        <p className="mt-1 text-sm text-texto-sec">Cuando un vendedor cotice, va a aparecer acá para comparar.</p>
      </div>
    );
  }

  return (
    <div>
      {aviso && <p className="mb-4 border border-error/40 bg-error-suave px-4 py-2.5 text-sm text-error">{aviso}</p>}
      <div className="overflow-x-auto border border-borde">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-[11px] uppercase tracking-[0.16em] text-texto-sec">
              <th className="px-4 py-3 font-normal">Vendedor</th>
              <th className="px-4 py-3 font-normal">Precio/kg</th>
              <th className="px-4 py-3 font-normal">Cantidad</th>
              <th className="px-4 py-3 font-normal">Plazo</th>
              <th className="px-4 py-3 font-normal">Notas</th>
              <th className="px-4 py-3 font-normal">Estado</th>
              <th className="px-4 py-3 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ofertas.map((o) => (
              <tr key={o.id} className="border-b border-borde align-top">
                <td className="px-4 py-3 text-texto">{o.vendedor_empresa ?? "—"}</td>
                <td className="px-4 py-3 font-serif text-base text-texto">
                  {o.precio_por_kg != null ? formatARS(o.precio_por_kg) : "—"}
                </td>
                <td className="px-4 py-3 text-texto-sec">{o.cantidad_ofrecida_kg != null ? `${o.cantidad_ofrecida_kg} kg` : "—"}</td>
                <td className="px-4 py-3 text-texto-sec">{o.plazo_entrega ?? "—"}</td>
                <td className="px-4 py-3 max-w-[24ch] text-texto-sec">{o.notas ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`whitespace-nowrap border px-2 py-1 text-xs ${ESTADO_BADGE[o.estado] ?? "text-texto-sec"}`}>
                    {o.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {o.estado === "aceptada" ? (
                      <button
                        type="button"
                        onClick={() => verContacto(o.id)}
                        disabled={cargando === o.id}
                        className="border border-exito/40 px-3 py-1.5 text-xs text-exito transition-colors hover:bg-exito/10 disabled:opacity-60"
                      >
                        {cargando === o.id ? "…" : "Contactar por WhatsApp"}
                      </button>
                    ) : (
                      abierta && o.estado !== "rechazada" && (
                        <button
                          type="button"
                          onClick={() => responder(o.id, "aceptada")}
                          disabled={cargando === o.id}
                          className="border border-borde px-3 py-1.5 text-xs text-texto transition-colors hover:border-exito hover:text-exito disabled:opacity-60"
                        >
                          Aceptar
                        </button>
                      )
                    )}
                    {abierta && o.estado === "enviada" && (
                      <button
                        type="button"
                        onClick={() => responder(o.id, "rechazada")}
                        disabled={cargando === o.id}
                        className="border border-borde px-3 py-1.5 text-xs text-texto-sec transition-colors hover:border-error hover:text-primario disabled:opacity-60"
                      >
                        Rechazar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-texto-sec">
        Al aceptar una oferta se habilita el WhatsApp del vendedor para coordinar.
      </p>
    </div>
  );
}
