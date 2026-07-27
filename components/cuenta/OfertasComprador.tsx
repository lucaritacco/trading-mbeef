"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { responderOferta, contactoOferta, type OfertaFila } from "@/lib/busquedas";
import { formatARS } from "@/lib/panel";

const ESTADO_BADGE: Record<string, string> = {
  enviada: "border-hueso/25 text-taupe",
  aceptada: "border-verde-claro/50 text-verde-claro",
  rechazada: "border-rojo/40 text-rojo-claro",
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
      <div className="border border-dashed border-hueso/20 px-6 py-12 text-center">
        <p className="text-hueso">Todavía no recibiste ofertas.</p>
        <p className="mt-1 text-sm text-taupe">Cuando un vendedor cotice, va a aparecer acá para comparar.</p>
      </div>
    );
  }

  return (
    <div>
      {aviso && <p className="mb-4 border border-rojo/40 bg-rojo/10 px-4 py-2.5 text-sm text-rojo-claro">{aviso}</p>}
      <div className="overflow-x-auto border border-hueso/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-hueso/10 text-left text-[11px] uppercase tracking-[0.16em] text-taupe">
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
              <tr key={o.id} className="border-b border-hueso/5 align-top">
                <td className="px-4 py-3 text-hueso">{o.vendedor_empresa ?? "—"}</td>
                <td className="px-4 py-3 font-serif text-base text-hueso">
                  {o.precio_por_kg != null ? formatARS(o.precio_por_kg) : "—"}
                </td>
                <td className="px-4 py-3 text-taupe">{o.cantidad_ofrecida_kg != null ? `${o.cantidad_ofrecida_kg} kg` : "—"}</td>
                <td className="px-4 py-3 text-taupe">{o.plazo_entrega ?? "—"}</td>
                <td className="px-4 py-3 max-w-[24ch] text-taupe/80">{o.notas ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`whitespace-nowrap border px-2 py-1 text-xs ${ESTADO_BADGE[o.estado] ?? "text-taupe"}`}>
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
                        className="border border-verde-claro/40 px-3 py-1.5 text-xs text-verde-claro transition-colors hover:bg-verde/20 disabled:opacity-60"
                      >
                        {cargando === o.id ? "…" : "Contactar por WhatsApp"}
                      </button>
                    ) : (
                      abierta && o.estado !== "rechazada" && (
                        <button
                          type="button"
                          onClick={() => responder(o.id, "aceptada")}
                          disabled={cargando === o.id}
                          className="border border-hueso/25 px-3 py-1.5 text-xs text-hueso transition-colors hover:border-verde-claro hover:text-verde-claro disabled:opacity-60"
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
                        className="border border-hueso/25 px-3 py-1.5 text-xs text-taupe transition-colors hover:border-rojo hover:text-rojo-claro disabled:opacity-60"
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
      <p className="mt-3 text-xs text-taupe/70">
        Al aceptar una oferta se habilita el WhatsApp del vendedor para coordinar.
      </p>
    </div>
  );
}
