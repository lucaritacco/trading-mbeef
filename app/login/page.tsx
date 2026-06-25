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
        <>
          <Link href="/recuperar" className="text-salmon hover:text-hueso">
            Olvidé mi contraseña
          </Link>
          <span className="mt-2 block text-taupe/70">
            ¿Sos del equipo de MBEEF? Entrá por{" "}
            <Link href="/panel/login" className="text-salmon hover:text-hueso">el panel</Link>.
          </span>
        </>
      }
    >
      <LoginUsuario />
    </AuthShell>
  );
}
