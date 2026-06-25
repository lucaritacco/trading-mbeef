"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { inputBase } from "@/lib/ui";

export default function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const supabase = createSupabaseBrowser();
    // Flujo estándar de Supabase. Requiere SMTP configurado para que llegue el mail
    // (ver TANDA3.md); si no, el equipo resetea la clave desde el panel de Supabase.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    });
    setEnviado(true);
    setCargando(false);
  }

  if (enviado) {
    return (
      <p className="text-sm leading-relaxed text-taupe">
        Si ese email tiene una cuenta, te enviamos un enlace para restablecer la
        contraseña. Revisá tu casilla.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-taupe">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
      </div>
      <button type="submit" disabled={cargando} className="w-full bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
        {cargando ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
