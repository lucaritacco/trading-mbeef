"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export type TipoEvento =
  | "request_created"
  | "request_approved"
  | "request_view"
  | "request_quote_started"
  | "request_quote_sent"
  | "request_offer_accepted"
  | "request_closed"
  | "request_share"
  | "whatsapp_unlocked";

/**
 * Registra un evento del funnel al montarse. Complementa a `visitas`, que cuenta
 * páginas: acá interesa la acción y quién la hizo (el actor lo pone la base con
 * auth.uid(), no el navegador, así nadie registra a nombre de otro).
 */
export default function RegistrarEvento({
  tipo,
  busquedaId,
  loteId,
}: {
  tipo: TipoEvento;
  busquedaId?: string;
  loteId?: string;
}) {
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    void registrarEvento(tipo, { busquedaId, loteId });
  }, [tipo, busquedaId, loteId]);

  return null;
}

/** Versión imperativa, para disparar desde un clic. */
export async function registrarEvento(
  tipo: TipoEvento,
  opts: { busquedaId?: string; loteId?: string; meta?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const supabase = createSupabaseBrowser();
    await supabase.rpc("registrar_evento", {
      p_tipo: tipo,
      p_busqueda_id: opts.busquedaId ?? null,
      p_lote_id: opts.loteId ?? null,
      p_meta: opts.meta ?? null,
    });
  } catch {
    /* medir nunca debe romper el flujo del usuario */
  }
}
