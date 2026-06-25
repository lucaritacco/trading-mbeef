import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/beta/AuthShell";
import RecuperarForm from "@/components/beta/RecuperarForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña | DeCarnes",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <AuthShell
      kicker="Tu cuenta"
      title="Recuperar contraseña"
      footer={
        <Link href="/login" className="text-salmon hover:text-hueso">
          Volver a ingresar
        </Link>
      }
    >
      <RecuperarForm />
    </AuthShell>
  );
}
