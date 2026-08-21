import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Confirmar suscripción | DeCarnes",
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aterrizaje del link del mail de confirmación. El token es la credencial:
// solo lo tiene quien recibió el mail en esa casilla.
export default async function ConfirmarSuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let ok = false;
  if (token && UUID_RE.test(token)) {
    const { data } = await supabase.rpc("confirmar_suscripcion", { p_token: token });
    ok = data === true;
  }

  return (
    <>
      <Header />
      <main className="min-h-svh bg-superficie text-texto">
        <div className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-texto-sec">Newsletter</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-texto sm:text-5xl">
            {ok ? "Suscripción confirmada" : "No pudimos confirmar"}
          </h1>
          <p className="mt-4 leading-relaxed text-texto-sec">
            {ok
              ? "Listo. Te vamos a avisar por mail cada vez que se publique un lote nuevo. Podés darte de baja desde cualquiera de esos mensajes."
              : "Este enlace no es válido o ya venció. Podés volver a anotarte desde el sitio."}
          </p>
          <Link
            href={ok ? "/mercado" : "/"}
            className="mt-8 inline-block bg-primario px-6 py-3.5 text-sm font-medium text-superficie transition-colors hover:bg-primario-hover"
          >
            {ok ? "Ver los lotes" : "Ir al inicio"}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
