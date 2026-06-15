import type { Metadata } from "next";
import Header from "@/components/Header";
import LegajoForm from "@/components/LegajoForm";

export const metadata: Metadata = {
  title: "Completá tu legajo | DeCarnes",
  description:
    "Cargá los datos de empresa y la documentación de aptitud para concretar la operación.",
  robots: { index: false, follow: false },
};

export default async function LegajoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-h-svh">
        <LegajoForm id={id} />
      </main>
    </>
  );
}
