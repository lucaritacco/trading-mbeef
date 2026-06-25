import type { Metadata } from "next";
import AuthShell from "@/components/beta/AuthShell";
import ActualizarClaveForm from "@/components/beta/ActualizarClaveForm";

export const metadata: Metadata = {
  title: "Nueva contraseña | DeCarnes",
  robots: { index: false, follow: false },
};

export default function ActualizarClavePage() {
  return (
    <AuthShell kicker="Tu cuenta" title="Elegí una nueva contraseña">
      <ActualizarClaveForm />
    </AuthShell>
  );
}
