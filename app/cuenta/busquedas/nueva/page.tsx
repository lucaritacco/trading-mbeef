import type { Metadata } from "next";
import NuevaBusquedaForm from "@/components/cuenta/NuevaBusquedaForm";

export const metadata: Metadata = {
  title: "Publicar solicitud | DeCarnes",
  robots: { index: false, follow: false },
};

export default function NuevaBusquedaPage() {
  return <NuevaBusquedaForm />;
}
