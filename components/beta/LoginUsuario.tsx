"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { inputBase } from "@/lib/ui";

export default function LoginUsuario() {
  const router = useRouter();
  const params = useSearchParams();
  // Preserva la intención: si venía a cotizar una solicitud, vuelve ahí.
  const next = params.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    router.push(destino);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-texto-sec">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-texto-sec">Contraseña</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={cargando} className="w-full bg-primario px-7 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
