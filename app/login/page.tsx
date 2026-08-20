import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/beta/AuthShell";
import LoginUsuario from "@/components/beta/LoginUsuario";

export const metadata: Metadata = {
  title: "Ingresar | DeCarnes",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      kicker="Tu cuenta"
      title="Ingresá al mercado"
      footer={
        <Link href="/recuperar" className="text-primario hover:text-texto">
          Olvidé mi contraseña
        </Link>
      }
    >
      <LoginUsuario />
    </AuthShell>
  );
}
