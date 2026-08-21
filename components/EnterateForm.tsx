"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { suscribir, emailValido } from "@/lib/suscripcion";
import { TextField } from "@/components/form/fields";

export default function EnterateForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Tu nombre.";
    if (!emailValido(email)) e.email = "Un email válido.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    setError(null);
    try {
      await suscribir(nombre, email);
      // Directo al catálogo igual: vino a ver lotes. Los avisos empiezan cuando
      // confirme el mail, y el aviso de eso queda en el pie del formulario.
      router.push("/mercado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {error && (
        <p className="mb-5 border border-error/40 bg-error-suave px-4 py-3 text-sm text-error">{error}</p>
      )}
      <div className="space-y-5">
        <TextField id="nombre" label="Nombre" required value={nombre} onChange={setNombre} error={errores.nombre} />
        <TextField id="email" label="Email" required type="email" inputMode="email" value={email} onChange={setEmail} error={errores.email} />
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="w-full bg-primario px-7 py-4 text-base font-medium text-superficie transition-colors hover:bg-primario-hover disabled:opacity-60"
        >
          {enviando ? "Un momento…" : "Ver lotes y recibir los nuevos"}
        </button>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/mercado" className="text-texto-sec underline-offset-4 transition-colors hover:text-texto hover:underline">
          Prefiero solo ver el catálogo →
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-texto-sec">
        Sin costo. Te mandamos un mail para confirmar la dirección y después te
        avisamos cada vez que se publica un lote nuevo. Podés darte de baja cuando
        quieras.
      </p>
    </div>
  );
}
