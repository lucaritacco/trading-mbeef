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

// Dos caminos en la misma ruta:
//  · /registro            → alta libre de comprador (email + contraseña).
//  · /registro?token=uuid → alta de frigorífico con invitación aprobada.
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Sin token: comprador. Es el camino principal desde la home.
  if (!token) {
    return (
      <AuthShell
        kicker="Cuenta de comprador"
        title="Creá tu cuenta"
        footer={
          <span className="text-texto-sec">
            ¿Sos frigorífico y querés publicar?{" "}
            <Link href="/vendedores" className="text-primario hover:text-texto">
              Registrá tu empresa
            </Link>
            .
          </span>
        }
      >
        <p className="mb-6 text-sm leading-relaxed text-texto-sec">
          Con tu cuenta ves los precios de todo el catálogo, consultás los lotes que
          te interesan y te avisamos cuando se publican nuevos. Sin costo.
        </p>
        <RegistroUsuario />
      </AuthShell>
    );
  }

  // Con token: tiene que ser una invitación válida y sin usar.
  let empresa: string | null = null;
  let valido = false;
  if (UUID_RE.test(token)) {
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
        kicker="Invitación de frigorífico"
        title="Invitación no válida"
        footer={
          <span className="text-texto-sec">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primario hover:text-texto">Ingresá</Link>.
          </span>
        }
      >
        <p className="text-sm leading-relaxed text-texto-sec">
          Este enlace de invitación no es válido, ya fue usado o todavía no está
          aprobado. Si creés que es un error, escribinos.
        </p>
        <p className="mt-6 text-sm leading-relaxed text-texto-sec">
          Si lo que querés es <strong className="text-texto">comprar</strong>, podés{" "}
          <Link href="/registro" className="text-primario hover:text-texto">
            crear tu cuenta de comprador
          </Link>{" "}
          ahora mismo, sin invitación.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Cuenta de frigorífico"
      title={empresa ? `Creá tu cuenta · ${empresa}` : "Creá tu cuenta"}
    >
      <RegistroUsuario token={token} />
    </AuthShell>
  );
}
