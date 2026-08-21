"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Completa el alta después de que el usuario confirma su email.
 *
 * signUp no puede crear la fila de `usuarios` cuando la confirmación está
 * activada, porque no hay sesión todavía. Al volver desde el mail sí la hay,
 * así que el alta se termina acá.
 */
export default function ConfirmarRegistro() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    (async () => {
      const supabase = createSupabaseBrowser();

      // El cliente canjea el código de la URL por una sesión, pero no es
      // inmediato. Se reintenta un rato antes de darlo por perdido.
      let sesion = null;
      for (let i = 0; i < 20 && !sesion; i++) {
        const { data } = await supabase.auth.getSession();
        sesion = data.session;
        if (!sesion) await new Promise((r) => setTimeout(r, 300));
      }
      if (!sesion) {
        setError("No pudimos validar el enlace. Puede haber vencido: probá iniciar sesión.");
        return;
      }

      // Si ya tiene fila, el link se tocó dos veces. No es un error.
      const { data: fila } = await supabase
        .from("usuarios")
        .select("id, rol_mercado")
        .eq("id", sesion.user.id)
        .maybeSingle();

      const next = params.get("next");
      const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const token = params.get("token");

      if (fila) {
        router.replace(destino ?? (fila.rol_mercado === "compra" ? "/mercado" : "/cuenta"));
        router.refresh();
        return;
      }

      if (token) {
        const { data: ok, error: err } = await supabase.rpc("canjear_invitacion", { p_token: token });
        if (err || ok !== true) {
          setError("No pudimos validar tu invitación. Puede estar vencida o ya usada.");
          return;
        }
        router.replace("/cuenta");
        router.refresh();
        return;
      }

      const empresa =
        typeof sesion.user.user_metadata?.empresa === "string"
          ? sesion.user.user_metadata.empresa.trim() || null
          : null;
      const { data: ok, error: err } = await supabase.rpc("crear_cuenta_comprador", {
        p_empresa: empresa,
      });
      if (err || ok !== true) {
        setError("Confirmamos tu email pero no pudimos activar la cuenta. Escribinos.");
        return;
      }
      router.replace(destino ?? "/mercado");
      router.refresh();
    })();
  }, [params, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-error">{error}</p>
        <Link href="/login" className="inline-block text-sm text-primario hover:text-texto">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-texto-sec">
      Un segundo, estamos activando tu cuenta…
    </p>
  );
}
