import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/beta/AuthShell";
import RegistroUsuario from "@/components/beta/RegistroUsuario";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Crear cuenta | DeCarnes",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Sin token válido no se muestra el formulario (solo aprobados con invitación).
  let empresa: string | null = null;
  let valido = false;
  if (token && UUID_RE.test(token)) {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.rpc("validar_invitacion", { p_token: token });
    const fila = Array.isArray(data) ? data[0] : null;
    if (fila?.valido) {
      valido = true;
      empresa = fila.empresa ?? null;
    }
  }

  if (!valido) {
    return (
      <AuthShell
        kicker="Acceso por invitación"
        title="Invitación no válida"
        footer={
          <span className="text-taupe/70">
            El acceso a la beta es por invitación. Si ya hablaste con el equipo,
            pediles el enlace. ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-salmon hover:text-hueso">Ingresá</Link>.
          </span>
        }
      >
        <p className="text-sm leading-relaxed text-taupe">
          Este enlace de invitación no es válido, ya fue usado o todavía no está
          aprobado. Si creés que es un error, escribinos.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Acceso por invitación"
      title={empresa ? `Creá tu cuenta · ${empresa}` : "Creá tu cuenta"}
    >
      <RegistroUsuario token={token!} />
    </AuthShell>
  );
}
