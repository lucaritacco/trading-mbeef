import type { Metadata } from "next";
import Header from "@/components/Header";
import PublicarWizard from "@/components/PublicarWizard";

export const metadata: Metadata = {
  title: "Publicá tu lote | DeCarnes",
  description:
    "Cargá tu lote de carne vacuna y tus condiciones. Sin documentación para publicar: recibís una cotización en firme en menos de 24 horas hábiles.",
};

export default function PublicarPage() {
  return (
    <>
      <Header />
      <main className="min-h-svh">
        <PublicarWizard />
      </main>
    </>
  );
}
