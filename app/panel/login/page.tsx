import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/panel/LoginForm";

export const metadata: Metadata = {
  title: "Panel · Ingresar | DeCarnes",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">DeCarnes · Mesa de operaciones</p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-hueso">Panel interno</h1>
        <p className="mt-2 mb-8 text-sm text-taupe">Acceso exclusivo del equipo de MBEEF.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
