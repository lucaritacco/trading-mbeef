"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cuenta la visita de cada página. Corre en el navegador a propósito: así no
 * suma los rastreos de Google ni los prefetch del servidor, que inflarían el
 * número sin ser gente. No guarda IP ni cookie, solo la ruta y de dónde vino.
 * Las páginas privadas (cuenta y panel) no se registran: no son tráfico.
 */
export default function RegistrarVisita() {
  const pathname = usePathname() ?? "/";
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/panel") || pathname.startsWith("/cuenta")) return;
    if (ultima.current === pathname) return; // evita doble conteo por re-render
    ultima.current = pathname;

    const m = pathname.match(/^\/lote\/([^/]+)$/);
    const loteId = m && UUID_RE.test(m[1]) ? m[1] : null;

    // Solo el dominio de origen, nunca la URL completa (puede llevar datos).
    let origen: string | null = null;
    try {
      if (document.referrer) {
        const r = new URL(document.referrer);
        origen = r.host === window.location.host ? null : r.host;
      }
    } catch {
      origen = null;
    }

    const supabase = createSupabaseBrowser();
    void supabase
      .rpc("registrar_visita", {
        p_path: pathname,
        p_lote_id: loteId,
        p_referrer: origen,
      })
      .then(() => undefined);
  }, [pathname]);

  return null;
}
