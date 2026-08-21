"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { suscribir, emailValido } from "@/lib/suscripcion";

const CLAVE = "decarnes_aviso_email";
const SEGUNDOS = 12;
const SCROLL = 0.45;

// Rutas donde no corresponde: ya está pidiendo el dato, o es zona privada.
const EXCLUIDAS = ["/registro", "/login", "/cuenta", "/panel", "/compradores", "/recuperar", "/avisos"];

/**
 * Captura de email para el visitante que mira y se va. Aparece a los 12 segundos
 * o al 45% de scroll (lo que pase primero): solo al que mostró interés, nunca de
 * entrada.
 *
 * Va anclado abajo y NO tapa la pantalla a propósito: Google penaliza los
 * interstitials que cubren el contenido en celular, y acabamos de indexar el
 * sitio. Convierte un poco menos que un modal, pero no arriesga el tráfico.
 */
export default function CapturaEmail({ logueado }: { logueado: boolean }) {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<null | "pendiente" | "ya-estaba">(null);

  const bloqueada = logueado || EXCLUIDAS.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (bloqueada) return;
    try {
      if (localStorage.getItem(CLAVE)) return; // ya se suscribió o lo cerró
    } catch {
      return;
    }

    let hecho = false;
    const mostrar = () => {
      if (hecho) return;
      hecho = true;
      setVisible(true);
    };

    const t = setTimeout(mostrar, SEGUNDOS * 1000);
    const onScroll = () => {
      const alto = document.body.scrollHeight - window.innerHeight;
      if (alto > 0 && window.scrollY / alto > SCROLL) mostrar();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [bloqueada]);

  function recordar() {
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      /* modo privado: no pasa nada, se vuelve a mostrar */
    }
  }

  function cerrar() {
    recordar();
    setVisible(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValido(email)) {
      setError("Escribí un email válido.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await suscribir("", email);
      recordar();
      setListo(r);
      setTimeout(() => setVisible(false), 5000);
    } catch {
      setError("No pudimos guardarlo. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (bloqueada || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:left-auto sm:right-6 sm:w-[26rem] sm:px-0 sm:pb-6">
      <div className="border border-borde bg-superficie p-5 shadow-lg">
        {listo ? (
          <div>
            <p className="font-serif text-lg font-medium text-texto">
              {listo === "ya-estaba" ? "Ya estabas anotado." : "Revisá tu mail."}
            </p>
            <p className="mt-1 text-sm text-texto-sec">
              {listo === "ya-estaba"
                ? "Esa dirección ya recibe los avisos de lotes nuevos."
                : "Te mandamos un mail para confirmar. Tocá el link y empezás a recibir los lotes nuevos."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-lg font-medium leading-snug text-texto">
                  ¿Querés mantenerte al día?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-texto-sec">
                  Dejanos tu mail y te avisamos cada vez que se publique un lote nuevo.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="-mr-1 -mt-1 shrink-0 p-1 text-texto-sec transition-colors hover:text-texto"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={enviar} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                aria-label="Tu email"
                className="min-w-0 flex-1 border border-borde bg-superficie px-3 py-2.5 text-sm text-texto placeholder:text-texto-sec/60 outline-none transition-colors focus:border-primario"
              />
              <button
                type="submit"
                disabled={enviando}
                className="shrink-0 bg-primario px-5 py-2.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60"
              >
                {enviando ? "Guardando…" : "Avisarme"}
              </button>
            </form>

            {error && <p className="mt-2 text-xs text-error">{error}</p>}
            <p className="mt-2 text-xs text-texto-sec">
              Sin costo. Te podés dar de baja cuando quieras.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
