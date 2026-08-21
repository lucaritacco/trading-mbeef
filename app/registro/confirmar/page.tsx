import type { Metadata } from "next";
import AuthShell from "@/components/beta/AuthShell";
import ConfirmarRegistro from "@/components/beta/ConfirmarRegistro";

export const metadata: Metadata = {
  title: "Confirmando tu cuenta | DeCarnes",
  robots: { index: false, follow: false },
};

// Aterrizaje del link de confirmación de email. Acá se completa el alta que
// signUp no pudo terminar: crear la fila de `usuarios` o canjear la invitación.
export default function ConfirmarPage() {
  return (
    <AuthShell kicker="Tu cuenta" title="Confirmando tu cuenta">
      <ConfirmarRegistro />
    </AuthShell>
  );
}
