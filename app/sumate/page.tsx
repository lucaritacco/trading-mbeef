import type { Metadata } from "next";
import Header from "@/components/Header";
import SumateForm from "@/components/SumateForm";

export const metadata: Metadata = {
  title: "Sumate al mercado de la carne | DeCarnes",
  description:
    "Dejanos tus datos y te contactamos para darte acceso al mercado de la carne. Powered by MBEEF.",
};

export default function SumatePage() {
  return (
    <>
      <Header />
      <main className="min-h-svh">
        <SumateForm />
      </main>
    </>
  );
}
