"use client";

import { useState } from "react";
import Link from "next/link";
import { crearSolicitud, ROL_OPCIONES, type SolicitudData } from "@/lib/beta";
import { validarCuit, formatearCuit } from "@/lib/validators";
import { TextField, TextArea, RadioCards } from "@/components/form/fields";

const EMPTY: SolicitudData = {
  nombre_contacto: "",
  empresa: "",
  cuit: "",
  rol: "",
  contacto: "",
  notas: "",
};

type Errores = Record<string, string>;

export default function SumateForm() {
  const [data, setData] = useState<SolicitudData>(EMPTY);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const set =
    <K extends keyof SolicitudData>(k: K) =>
    (v: SolicitudData[K]) =>
      setData((d) => ({ ...d, [k]: v }));

  function validar(): Errores {
    const e: Errores = {};
    if (!data.nombre_contacto.trim()) e.nombre_contacto = "Tu nombre y apellido.";
    if (!data.empresa.trim()) e.empresa = "Tu empresa o razón social.";
    if (!validarCuit(data.cuit)) e.cuit = "CUIT inválido (revisá el número).";
    if (!data.rol) e.rol = "Elegí una opción.";
    if (!data.contacto.trim()) e.contacto = "Dejanos un WhatsApp o email.";
    return e;
  }

  async function enviar() {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await crearSolicitud(data);
      setListo(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-36 sm:px-8">
        <div className="flex h-14 w-14 items-center justify-center border border-verde-claro/50">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-verde-claro" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1 className="mt-6 font-serif text-4xl font-medium text-hueso sm:text-5xl">
          ¡Listo! Recibimos tu solicitud.
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-taupe">
          Te vamos a contactar para darte acceso al mercado.
        </p>
        <Link href="/" className="mt-8 inline-block border border-hueso/30 px-7 py-4 text-base text-hueso transition-colors hover:border-hueso/70">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-32 sm:px-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-taupe">Acceso a la beta</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-hueso sm:text-5xl">
        Sumate al mercado de la carne
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-taupe">
        Dejanos tus datos y te contactamos para darte acceso. Powered by MBEEF.
      </p>

      {errorEnvio && (
        <p className="mt-6 border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-rojo-claro">
          {errorEnvio}
        </p>
      )}

      <div className="mt-10 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <TextField id="nombre_contacto" label="Nombre y apellido" required value={data.nombre_contacto} onChange={set("nombre_contacto")} error={errores.nombre_contacto} />
          <TextField id="empresa" label="Empresa / razón social" required value={data.empresa} onChange={set("empresa")} error={errores.empresa} />
        </div>
        <TextField id="cuit" label="CUIT" required inputMode="numeric" placeholder="XX-XXXXXXXX-X" maxLength={13} value={data.cuit} onChange={(v) => set("cuit")(formatearCuit(v))} error={errores.cuit} hint="No te pedimos constancias ni documentos." />
        <RadioCards label="¿Qué hacés?" required value={data.rol} onChange={set("rol")} options={ROL_OPCIONES} error={errores.rol} />
        <TextField id="contacto" label="WhatsApp o email" required placeholder="Cómo te contactamos" value={data.contacto} onChange={set("contacto")} error={errores.contacto} />
        <TextArea id="notas" label="Comentario" placeholder="Lo que quieras contarnos (opcional)" value={data.notas} onChange={set("notas")} />

        <div className="flex items-center justify-between pt-2">
          <Link href="/" className="text-sm text-taupe transition-colors hover:text-hueso">
            Cancelar
          </Link>
          <button type="button" onClick={enviar} disabled={enviando} className="bg-bordo px-7 py-3.5 text-base font-medium text-hueso transition-colors hover:bg-rojo disabled:opacity-60">
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
