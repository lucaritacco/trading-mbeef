"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { inputBase } from "@/lib/ui";

// Registro con dos caminos sobre el mismo formulario:
//  · SIN token  → comprador. Alta libre (email + contraseña) y queda con rol
//    'compra': ve precios y catálogo, recibe avisos, NO puede publicar.
//  · CON token  → frigorífico. Canjea la invitación aprobada por el equipo.
export default function RegistroUsuario({ token }: { token?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  // Con la confirmación de email activada, signUp no devuelve sesión: la cuenta
  // recién queda utilizable cuando el usuario toca el link del mail.
  const [aConfirmar, setAConfirmar] = useState(false);

  const esComprador = !token;

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

    // A dónde vuelve desde el mail de confirmación. Lleva el token de invitación
    // para no perderlo: sin él, el frigorífico volvería como comprador.
    const volver = new URL("/registro/confirmar", window.location.origin);
    if (token) volver.searchParams.set("token", token);
    if (destino) volver.searchParams.set("next", destino);

    const { data, error: errSignUp } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: volver.toString() },
    });
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

    // Sin sesión = Supabase está pidiendo confirmar el email. No es un error:
    // el alta se completa en /registro/confirmar cuando toca el link.
    if (!data.session) {
      setAConfirmar(true);
      setCargando(false);
      return;
    }

    if (esComprador) {
      const { data: ok, error: errAlta } = await supabase.rpc("crear_cuenta_comprador", {
        p_empresa: null,
      });
      if (errAlta || ok !== true) {
        setError("Creamos tu usuario pero no pudimos activar la cuenta. Escribinos.");
        setCargando(false);
        return;
      }
      router.push(destino ?? "/mercado");
      router.refresh();
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

  if (aConfirmar) {
    return (
      <div className="space-y-4">
        <p className="font-serif text-2xl font-medium text-texto">Revisá tu mail</p>
        <p className="text-sm leading-relaxed text-texto-sec">
          Te mandamos un mensaje a <strong className="text-texto">{email}</strong> con
          un enlace para confirmar tu cuenta. Tocalo y quedás adentro.
        </p>
        <p className="text-sm leading-relaxed text-texto-sec">
          Si no aparece en un par de minutos, fijate en correo no deseado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-texto-sec">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-texto-sec">Contraseña</label>
        <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label htmlFor="password2" className="mb-2 block text-sm text-texto-sec">Repetí la contraseña</label>
        <input id="password2" type="password" autoComplete="new-password" required value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputBase} />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={cargando} className="w-full bg-primario px-7 py-3.5 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60">
        {cargando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      {esComprador && (
        <p className="text-xs leading-relaxed text-texto-sec">
          Al crear tu cuenta vas a ver los precios del catálogo y recibir avisos de
          lotes nuevos. Podés darte de baja de los avisos cuando quieras.
        </p>
      )}
      <p className="text-sm text-texto-sec">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primario hover:text-texto">Iniciá sesión</Link>
      </p>
    </form>
  );
}
