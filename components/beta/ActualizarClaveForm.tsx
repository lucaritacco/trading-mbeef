"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { inputBase } from "@/lib/ui";

export default function ActualizarClaveForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setCargando(true);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("No pudimos actualizar la contraseña. Pedí un enlace nuevo.");
      setCargando(false);
      return;
    }
    router.push("/cuenta");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-taupe">Nueva contraseña</label>
        <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} />
      </div>
      {error && <p className="text-sm text-rojo-claro">{error}</p>}
      <button type="submit" disabled={cargando} className="w-full bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
        {cargando ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
