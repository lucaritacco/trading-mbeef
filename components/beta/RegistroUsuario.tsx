"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { inputBase } from "@/lib/ui";

export default function RegistroUsuario({ token }: { token: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const supabase = createSupabaseBrowser();

    const { data, error: errSignUp } = await supabase.auth.signUp({ email, password });
    if (errSignUp) {
      const m = errSignUp.message.toLowerCase();
      if (m.includes("already registered") || m.includes("already been registered")) {
        setError("Ya existe una cuenta con ese email. Probá iniciar sesión.");
      } else if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
        setError("El registro no está habilitado todavía. Avisale al equipo.");
      } else {
        setError(errSignUp.message);
      }
      setCargando(false);
      return;
    }

    // Necesitamos sesión para canjear el token (requiere confirmación de email
    // desactivada en Supabase; ver TANDA3.md).
    if (!data.session) {
      setError(
        "No pudimos iniciar tu sesión automáticamente. Avisale al equipo (falta habilitar el alta sin confirmación de email).",
      );
      setCargando(false);
      return;
    }

    const { data: ok, error: errCanje } = await supabase.rpc("canjear_invitacion", {
      p_token: token,
    });
    if (errCanje || ok !== true) {
      setError("No pudimos validar tu invitación. Puede estar vencida o ya usada.");
      setCargando(false);
      return;
    }

    router.push("/cuenta");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-taupe">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-taupe">Contraseña</label>
        <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label htmlFor="password2" className="mb-2 block text-sm text-taupe">Repetí la contraseña</label>
        <input id="password2" type="password" autoComplete="new-password" required value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputBase} />
      </div>
      {error && <p className="text-sm text-rojo-claro">{error}</p>}
      <button type="submit" disabled={cargando} className="w-full bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
        {cargando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      <p className="text-sm text-taupe">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-salmon hover:text-hueso">Iniciá sesión</Link>
      </p>
    </form>
  );
}
